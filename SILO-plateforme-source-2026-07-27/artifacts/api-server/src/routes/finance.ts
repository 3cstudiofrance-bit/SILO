import { Router, type IRouter } from "express";
import { requireAuth } from "@clerk/express";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import {
  db,
  frpMovementsTable,
  partnerMissionsTable,
  projectsTable,
  transactionsTable,
  type Transaction,
} from "@workspace/db";
import { CreateTransactionBody } from "@workspace/api-zod";
import { z } from "zod";
import {
  FINANCIAL_CALCULATION_VERSION,
  computeOperationalAllocation,
  eurosToCents,
  meetsQuoteFloor,
  quoteFloorFor,
  frpOutcome,
} from "../lib/finance";
import { getRoleAsync, getUserId } from "../lib/roles";
import { resolveFeatureFlagForRequest } from "../lib/feature-flags";
import { authorizeProject } from "../lib/project-access";
import {
  getStripeCheckoutReturnUrls,
  getStripeClient,
} from "../lib/stripe-webhooks";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const transactionIdSchema = z.coerce.number().int().positive();

/**
 * Visibilité des montants par rôle (règle CDC, appliquée côté serveur) :
 * - client : montant total uniquement (jamais la répartition)
 * - partner : uniquement sa part agence (70 %)
 * - pm / admin : répartition complète
 */
function shapeTransaction(t: Transaction, role: string) {
  const base = {
    id: t.id,
    projectId: t.projectId,
    title: t.title,
    kind: t.kind,
    status: t.status,
    date: t.date,
    agencyName: t.agencyName,
    paidAt: t.paidAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
  };
  if (role === "admin" || role === "pm") {
    return {
      ...base,
      clientUserId: t.clientUserId,
      agencyId: t.agencyId,
      amountHt: t.amountHt,
      tva: t.tva,
      ttc: t.ttc,
      partAgence: t.partAgence,
      partSilo: t.partSilo,
      partFrp: t.partFrp,
      advisorUserId: t.advisorUserId,
      fraisPspTotal: t.fraisPspTotal,
      fraisPspAgence: t.fraisPspAgence,
      fraisPspSilo: t.fraisPspSilo,
      partAgenceApresPsp: t.partAgenceApresPsp,
      partSiloApresPsp: t.partSiloApresPsp,
      reserveIncidents: t.reserveIncidents,
      primeConseiller: t.primeConseiller,
      contributionSiloApresVariables: t.contributionSiloApresVariables,
      calculationVersion: t.calculationVersion,
    };
  }
  if (role === "partner") {
    return {
      ...base,
      agencyId: t.agencyId,
      clientUserId: null,
      amountHt: null,
      tva: null,
      ttc: null,
      partAgence: t.partAgence,
      partSilo: null,
      partFrp: null,
      advisorUserId: null,
      fraisPspTotal: null,
      fraisPspAgence: t.fraisPspAgence,
      fraisPspSilo: null,
      partAgenceApresPsp: t.partAgenceApresPsp,
      partSiloApresPsp: null,
      reserveIncidents: null,
      primeConseiller: null,
      contributionSiloApresVariables: null,
      calculationVersion: t.calculationVersion,
    };
  }
  // client : total seul
  return {
    ...base,
    agencyId: null,
    clientUserId: t.clientUserId,
    amountHt: t.amountHt,
    tva: t.tva,
    ttc: t.ttc,
    partAgence: null,
    partSilo: null,
    partFrp: null,
    advisorUserId: null,
    fraisPspTotal: null,
    fraisPspAgence: null,
    fraisPspSilo: null,
    partAgenceApresPsp: null,
    partSiloApresPsp: null,
    reserveIncidents: null,
    primeConseiller: null,
    contributionSiloApresVariables: null,
    calculationVersion: t.calculationVersion,
  };
}

router.get("/transactions", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  const userId = getUserId(req)!;
  if (
    role === "pm" &&
    !(await resolveFeatureFlagForRequest(req, "acces_infos_financieres"))
  ) {
    res.status(403).json({
      error: "Acces financier non active par l'administration",
    });
    return;
  }

  let rows: Transaction[];
  if (role === "admin") {
    rows = await db
      .select()
      .from(transactionsTable)
      .orderBy(desc(transactionsTable.date));
  } else if (role === "pm") {
    rows = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.advisorUserId, userId))
      .orderBy(desc(transactionsTable.date));
  } else if (role === "partner") {
    rows = await db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.agencyId, userId),
          inArray(transactionsTable.status, ["confirmee", "remboursee"]),
        ),
      )
      .orderBy(desc(transactionsTable.date));
  } else {
    rows = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.clientUserId, userId))
      .orderBy(desc(transactionsTable.date));
  }

  res.json(rows.map((t) => shapeTransaction(t, role)));
});

router.post("/transactions", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  if (role !== "admin" && role !== "pm") {
    res
      .status(403)
      .json({ error: "Accès refusé — réservé à l'admin et au chef de projet" });
    return;
  }
  if (
    role === "pm" &&
    !(await resolveFeatureFlagForRequest(req, "acces_infos_financieres"))
  ) {
    res.status(403).json({
      error: "Creation de transaction non activee par l'administration",
    });
    return;
  }

  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Données invalides", details: parsed.error.issues });
    return;
  }
  const data = parsed.data;
  const kind = data.kind as "ponctuel" | "abonnement";

  if (!meetsQuoteFloor(data.amountHt, kind)) {
    res.status(400).json({
      error: `Montant sous le plancher : ${kind} ≥ ${quoteFloorFor(kind)} € HT`,
    });
    return;
  }

  const access = await authorizeProject(req, res, data.projectId);
  if (!access) return;
  if (!access.project.clientUserId) {
    res.status(400).json({
      error:
        "Le client doit avoir un compte SILO lié au projet avant la préparation du paiement",
    });
    return;
  }

  const [mission] = await db
    .select()
    .from(partnerMissionsTable)
    .where(
      and(
        eq(partnerMissionsTable.projectId, data.projectId),
        eq(partnerMissionsTable.partnerId, data.agencyId),
        ne(partnerMissionsTable.status, "refuse"),
      ),
    )
    .limit(1);
  if (!mission) {
    res.status(400).json({
      error:
        "Le partenaire doit avoir une mission active sur ce projet avant la préparation du paiement",
    });
    return;
  }

  // Répartition et hypothèses opérationnelles TOUJOURS calculées côté serveur.
  const allocation = computeOperationalAllocation(data.amountHt, {
    advisorCommissionEligible: Boolean(access.project.advisorUserId),
  });
  const date = data.date ?? new Date().toISOString().slice(0, 10);

  const [tx] = await db
    .insert(transactionsTable)
    .values({
      projectId: data.projectId,
      title: data.title,
      clientUserId: access.project.clientUserId,
      agencyId: mission.partnerId,
      agencyName: mission.partnerName,
      advisorUserId: access.project.advisorUserId,
      kind,
      status: "en_attente_paiement",
      amountHt: allocation.ht,
      tva: allocation.tva,
      ttc: allocation.ttc,
      partAgence: allocation.partAgence,
      partSilo: allocation.partSilo,
      partFrp: allocation.partFrp,
      fraisPspTotal: allocation.fraisPspTotal,
      fraisPspAgence: allocation.fraisPspAgence,
      fraisPspSilo: allocation.fraisPspSilo,
      partAgenceApresPsp: allocation.partAgenceApresPsp,
      partSiloApresPsp: allocation.partSiloApresPsp,
      reserveIncidents: allocation.reserveIncidents,
      primeConseiller: allocation.primeConseiller,
      contributionSiloApresVariables: allocation.contributionSiloApresVariables,
      calculationVersion: FINANCIAL_CALCULATION_VERSION,
      date,
    })
    .returning();

  if (!tx) {
    throw new Error("La transaction financiere n'a pas ete creee.");
  }

  res.status(201).json(shapeTransaction(tx, role));
});

router.post("/transactions/:id/checkout", requireAuth(), async (req, res) => {
  const idResult = transactionIdSchema.safeParse(req.params.id);
  if (!idResult.success) {
    res.status(400).json({ error: "Identifiant de transaction invalide" });
    return;
  }

  const role = await getRoleAsync(req);
  const userId = getUserId(req)!;
  if (role !== "client") {
    res.status(403).json({
      error: "Le règlement doit être initié par le client concerné",
    });
    return;
  }

  const [transaction] = await db
    .select()
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.id, idResult.data),
        eq(transactionsTable.clientUserId, userId),
      ),
    )
    .limit(1);

  if (!transaction) {
    res.status(404).json({ error: "Transaction introuvable" });
    return;
  }
  if (
    transaction.status !== "en_attente_paiement" &&
    transaction.status !== "echouee"
  ) {
    res.status(409).json({
      error:
        transaction.status === "confirmee"
          ? "Ce paiement est déjà confirmé"
          : "Cette transaction ne peut plus être réglée",
    });
    return;
  }

  try {
    const stripe = getStripeClient();
    if (transaction.stripeCheckoutSessionId) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(
          transaction.stripeCheckoutSessionId,
        );
        if (existingSession.status === "open" && existingSession.url) {
          res.json({ url: existingSession.url });
          return;
        }
        if (existingSession.payment_status === "paid") {
          res.status(409).json({
            error:
              "Le paiement a été reçu et sa confirmation est en cours de traitement",
          });
          return;
        }
      } catch (error) {
        const code =
          error && typeof error === "object" && "code" in error
            ? (error as { code?: unknown }).code
            : null;
        if (code !== "resource_missing") throw error;
      }
    }

    const [{ clientEmail } = { clientEmail: null }] = transaction.projectId
      ? await db
          .select({ clientEmail: projectsTable.clientEmail })
          .from(projectsTable)
          .where(eq(projectsTable.id, transaction.projectId))
          .limit(1)
      : [];
    const { successUrl, cancelUrl } = getStripeCheckoutReturnUrls();
    const metadata = {
      transactionId: String(transaction.id),
      projectId: String(transaction.projectId),
      clientUserId: transaction.clientUserId ?? "",
      calculationVersion: transaction.calculationVersion,
    };
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        locale: "fr",
        client_reference_id: String(transaction.id),
        customer_creation: "always",
        customer_email: clientEmail ?? undefined,
        billing_address_collection: "required",
        tax_id_collection: { enabled: true },
        invoice_creation: {
          enabled: true,
          invoice_data: {
            description: transaction.title,
            metadata,
          },
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: eurosToCents(transaction.ttc),
              product_data: {
                name: transaction.title,
                description:
                  transaction.kind === "abonnement"
                    ? "Échéance mensuelle SILO, sans engagement"
                    : "Prestation SILO",
                metadata,
              },
            },
          },
        ],
        metadata,
        payment_intent_data: { metadata },
        success_url: successUrl,
        cancel_url: cancelUrl,
      },
      {
        idempotencyKey: `silo-transaction-${transaction.id}-${transaction.updatedAt.getTime()}`,
      },
    );

    if (!session.url) {
      throw new Error("Stripe n'a pas retourné d'URL de paiement");
    }

    const [stored] = await db
      .update(transactionsTable)
      .set({
        status: "en_attente_paiement",
        stripeCheckoutSessionId: session.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(transactionsTable.id, transaction.id),
          eq(transactionsTable.clientUserId, userId),
          inArray(transactionsTable.status, ["en_attente_paiement", "echouee"]),
        ),
      )
      .returning({ id: transactionsTable.id });

    if (!stored) {
      if (session.status === "open") {
        await stripe.checkout.sessions.expire(session.id);
      }
      res.status(409).json({
        error: "L'état de la transaction a changé, veuillez actualiser la page",
      });
      return;
    }

    res.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur Stripe inconnue";
    logger.error(
      { transactionId: transaction.id, error: message },
      "Stripe Checkout creation failed",
    );
    const configurationError =
      message.includes("non configuree") ||
      message.includes("non configure") ||
      message.includes("APP_BASE_URL");
    res.status(configurationError ? 503 : 502).json({
      error: configurationError
        ? "Le paiement en ligne n'est pas encore configuré"
        : "Le service de paiement est momentanément indisponible",
    });
  }
});

async function computeFrpAccounts(agencyFilter?: string) {
  const movements = agencyFilter
    ? await db
        .select()
        .from(frpMovementsTable)
        .where(eq(frpMovementsTable.agencyId, agencyFilter))
    : await db.select().from(frpMovementsTable);

  const agencyIds = Array.from(new Set(movements.map((m) => m.agencyId)));
  const txs = agencyIds.length
    ? await db
        .select()
        .from(transactionsTable)
        .where(inArray(transactionsTable.agencyId, agencyIds))
    : [];

  const year = new Date().getFullYear();
  return agencyIds.map((agencyId) => {
    const mine = movements.filter((m) => m.agencyId === agencyId);
    const balance =
      Math.round(mine.reduce((s, m) => s + m.amount, 0) * 100) / 100;
    const transactionsThisYear = txs.filter(
      (t) =>
        t.agencyId === agencyId &&
        t.status === "confirmee" &&
        (t.paidAt?.getFullYear() ?? new Date(t.date).getFullYear()) === year,
    ).length;
    return {
      agencyId,
      agencyName: mine[0]?.agencyName ?? agencyId,
      balance,
      transactionsThisYear,
      outcome: frpOutcome(transactionsThisYear),
    };
  });
}

router.get("/frp/accounts", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  if (role === "client") {
    res
      .status(403)
      .json({ error: "Accès refusé — le FRP n'est pas visible côté client" });
    return;
  }
  if (
    role === "pm" &&
    !(await resolveFeatureFlagForRequest(req, "acces_frp"))
  ) {
    res.status(403).json({
      error: "Acces FRP non active par l'administration",
    });
    return;
  }
  const accounts = await computeFrpAccounts(
    role === "partner" ? getUserId(req)! : undefined,
  );
  res.json(accounts);
});

router.get("/frp/movements", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  if (role === "client") {
    res
      .status(403)
      .json({ error: "Accès refusé — le FRP n'est pas visible côté client" });
    return;
  }
  if (
    role === "pm" &&
    !(await resolveFeatureFlagForRequest(req, "acces_frp"))
  ) {
    res.status(403).json({
      error: "Acces FRP non active par l'administration",
    });
    return;
  }
  const movements =
    role === "partner"
      ? await db
          .select()
          .from(frpMovementsTable)
          .where(eq(frpMovementsTable.agencyId, getUserId(req)!))
          .orderBy(desc(frpMovementsTable.date))
      : await db
          .select()
          .from(frpMovementsTable)
          .orderBy(desc(frpMovementsTable.date));

  res.json(
    movements.map((m) => ({
      id: m.id,
      transactionId: m.transactionId,
      agencyId: m.agencyId,
      agencyName: m.agencyName,
      date: m.date,
      label: m.label,
      projectTitle: m.projectTitle,
      type: m.type,
      amount: m.amount,
    })),
  );
});

export default router;
