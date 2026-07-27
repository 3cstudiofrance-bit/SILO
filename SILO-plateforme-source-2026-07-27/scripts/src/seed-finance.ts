/**
 * Seed des transactions financières et mouvements FRP (dev).
 * La répartition 70/20/10 est calculée ici avec les mêmes règles que le serveur.
 * Usage : pnpm --filter @workspace/scripts run seed-finance
 */
import { db, pool, transactionsTable, frpMovementsTable } from "@workspace/db";
import { getPartnerClerkId, ensureClientClerkId } from "./clerk-test-users";

const SPLIT = { agence: 0.7, silo: 0.2, frp: 0.1 } as const;
const round = (n: number) => Math.round(n * 100) / 100;

function computeSplit(ht: number) {
  const partAgence = round(ht * SPLIT.agence);
  const partFrp = round(ht * SPLIT.frp);
  const partSilo = round(ht - partAgence - partFrp);
  const tva = round(ht * 0.2);
  return { tva, ttc: round(ht + tva), partAgence, partSilo, partFrp };
}

async function main() {
  const existing = await db.select({ id: transactionsTable.id }).from(transactionsTable).limit(1);
  if (existing.length) {
    console.log("Des transactions existent déjà — seed ignoré.");
    return;
  }

  const partnerId = await getPartnerClerkId();
  const clientId = await ensureClientClerkId();
  const year = new Date().getFullYear();

  const seeds = [
    { title: "Film corporate — Groupe Nexa", agencyId: partnerId, agencyName: "Studio Lumen", kind: "ponctuel", amountHt: 4800, date: `${year}-02-12`, projectTitle: "Film corporate Nexa", clientUserId: clientId },
    { title: "Pack social Business — Maison Delva", agencyId: partnerId, agencyName: "Studio Lumen", kind: "abonnement", amountHt: 1190, date: `${year}-03-01`, projectTitle: "Pack social Delva", clientUserId: clientId },
    { title: "Captation live — Festival Ondes", agencyId: partnerId, agencyName: "Studio Lumen", kind: "ponctuel", amountHt: 2600, date: `${year}-04-22`, projectTitle: "Festival Ondes" },
    { title: "Clip musical — Naïa", agencyId: "agency-vertigo", agencyName: "Vertigo Films", kind: "ponctuel", amountHt: 3200, date: `${year}-01-30`, projectTitle: "Clip Naïa" },
    { title: "Pack social Premium — Atelier Roux", agencyId: "agency-vertigo", agencyName: "Vertigo Films", kind: "abonnement", amountHt: 1990, date: `${year}-05-15`, projectTitle: "Pack social Roux" },
  ] as const;

  for (const s of seeds) {
    const split = computeSplit(s.amountHt);
    const [tx] = await db
      .insert(transactionsTable)
      .values({
        title: s.title,
        clientUserId: "clientUserId" in s ? s.clientUserId : null,
        agencyId: s.agencyId,
        agencyName: s.agencyName,
        kind: s.kind,
        status: "confirmee",
        amountHt: s.amountHt,
        tva: split.tva,
        ttc: split.ttc,
        partAgence: split.partAgence,
        partSilo: split.partSilo,
        partFrp: split.partFrp,
        date: s.date,
      })
      .returning();
    await db.insert(frpMovementsTable).values({
      transactionId: tx.id,
      agencyId: s.agencyId,
      agencyName: s.agencyName,
      date: s.date,
      label: `Crédit FRP 10 % — ${s.title}`,
      projectTitle: s.projectTitle,
      type: "credit",
      amount: split.partFrp,
    });
    console.log(`+ ${s.title} (HT ${s.amountHt} € → agence ${split.partAgence} / Silo ${split.partSilo} / FRP ${split.partFrp})`);
  }
  console.log("Seed terminé.");
}

main()
  .catch(e => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
