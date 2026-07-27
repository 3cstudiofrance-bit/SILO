/**
 * Test e2e (rôle client) des règles de visibilité finance, côté API réelle.
 *
 * Vérifie qu'un client :
 * - voit uniquement SES transactions (client_user_id), avec le montant total
 *   (amountHt/tva/ttc) mais JAMAIS la répartition (partAgence/partSilo/partFrp = null)
 * - reçoit 403 sur GET /api/frp/accounts et GET /api/frp/movements
 * - reçoit 403 sur POST /api/transactions
 *
 * Prérequis : API Server démarré (proxy localhost:80), DATABASE_URL, CLERK_SECRET_KEY.
 * Usage : pnpm --filter @workspace/scripts run e2e-finance-client
 */
import { eq } from "drizzle-orm";
import { db, pool, transactionsTable } from "@workspace/db";
import { ensureClientClerkId, mintSessionJwt } from "./clerk-test-users";

const API = process.env.E2E_API_BASE ?? "http://localhost:80/api";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) {
    console.log(`✓ ${label}`);
  } else {
    failures++;
    console.error(`✗ ${label}${detail !== undefined ? ` — ${JSON.stringify(detail)}` : ""}`);
  }
}

async function main() {
  // 1. Compte client de test (créé/patché si besoin) + au moins une transaction liée.
  const clientId = await ensureClientClerkId();
  const linked = await db
    .select({ id: transactionsTable.id })
    .from(transactionsTable)
    .where(eq(transactionsTable.clientUserId, clientId));
  if (!linked.length) {
    const [first] = await db.select({ id: transactionsTable.id }).from(transactionsTable).limit(1);
    if (!first) throw new Error("Aucune transaction en base — lancer d'abord seed-finance");
    await db
      .update(transactionsTable)
      .set({ clientUserId: clientId })
      .where(eq(transactionsTable.id, first.id));
  }
  const expectedIds = new Set(
    (
      await db
        .select({ id: transactionsTable.id })
        .from(transactionsTable)
        .where(eq(transactionsTable.clientUserId, clientId))
    ).map((r) => r.id),
  );

  // 2. JWT de session client.
  const jwt = await mintSessionJwt(clientId);
  const auth = { Authorization: `Bearer ${jwt}` };

  // 3. GET /transactions : uniquement SES transactions, total visible, répartition null.
  const txRes = await fetch(`${API}/transactions`, { headers: auth });
  check("GET /transactions → 200", txRes.status === 200, txRes.status);
  const txs = (await txRes.json()) as Array<Record<string, unknown>>;
  check(
    `GET /transactions → ${expectedIds.size} transaction(s) du client uniquement`,
    txs.length === expectedIds.size && txs.every((t) => expectedIds.has(t.id as number)),
    txs.map((t) => t.id),
  );
  for (const t of txs) {
    check(`tx ${t.id} : montant total visible (amountHt/tva/ttc)`,
      typeof t.amountHt === "number" && typeof t.tva === "number" && typeof t.ttc === "number", t);
    check(`tx ${t.id} : répartition masquée (partAgence/partSilo/partFrp = null)`,
      t.partAgence === null && t.partSilo === null && t.partFrp === null, t);
  }

  // 4. FRP interdit au client.
  const accounts = await fetch(`${API}/frp/accounts`, { headers: auth });
  check("GET /frp/accounts → 403", accounts.status === 403, accounts.status);
  const movements = await fetch(`${API}/frp/movements`, { headers: auth });
  check("GET /frp/movements → 403", movements.status === 403, movements.status);

  // 5. Création de transaction interdite au client.
  const post = await fetch(`${API}/transactions`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ title: "tentative client", agencyId: "x", agencyName: "x", kind: "ponctuel", amountHt: 900 }),
  });
  check("POST /transactions → 403", post.status === 403, post.status);

  if (failures) {
    console.error(`\n${failures} échec(s).`);
    process.exitCode = 1;
  } else {
    console.log("\nTous les tests client sont passés.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
