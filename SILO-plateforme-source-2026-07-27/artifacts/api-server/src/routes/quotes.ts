import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { quotesTable, activityTable } from "@workspace/db";
import {
  CreateQuoteBody,
  GetQuoteParams,
  UpdateQuoteTreatmentBody,
  UpdateQuoteTreatmentParams,
  UpdateQuoteParams,
  UpdateQuoteBody,
} from "@workspace/api-zod";
import { getRoleAsync, getUserId, getUserNameAsync } from "../lib/roles";
import { getAdvisorCapacity } from "../lib/advisor-capacity";

const router = Router();

function formatQuote(q: any, includeWorkflow = false) {
  return {
    id: q.id,
    serviceType: q.serviceType,
    status: q.status,
    clientName: q.clientName,
    clientEmail: q.clientEmail,
    clientUserId: q.clientUserId,
    advisorUserId: q.advisorUserId,
    workflowStatus: includeWorkflow ? q.workflowStatus : null,
    waitReason: includeWorkflow ? q.waitReason : null,
    waitUntil:
      includeWorkflow && q.waitUntil ? q.waitUntil.toISOString() : null,
    followUpUntil:
      includeWorkflow && q.followUpUntil ? q.followUpUntil.toISOString() : null,
    reservedAt:
      includeWorkflow && q.reservedAt ? q.reservedAt.toISOString() : null,
    lastTreatedAt:
      includeWorkflow && q.lastTreatedAt ? q.lastTreatedAt.toISOString() : null,
    closedAt: includeWorkflow && q.closedAt ? q.closedAt.toISOString() : null,
    details: q.details,
    budget: q.budget,
    amount: q.amount,
    notes: q.notes,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
  };
}

router.get("/quotes", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  const userId = getUserId(req)!;
  let quotes;
  if (role === "admin") {
    quotes = await db.select().from(quotesTable);
  } else if (role === "pm") {
    quotes = await db
      .select()
      .from(quotesTable)
      .where(
        or(
          eq(quotesTable.advisorUserId, userId),
          isNull(quotesTable.advisorUserId),
        ),
      );
  } else if (role === "partner") {
    res.status(403).json({ error: "Acces refuse" });
    return;
  } else {
    quotes = await db
      .select()
      .from(quotesTable)
      .where(eq(quotesTable.clientUserId, userId));
  }
  res.json(
    quotes.map((quote) =>
      formatQuote(quote, role === "admin" || role === "pm"),
    ),
  );
});

router.post("/quotes", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  const userId = getUserId(req)!;
  if (role === "partner") {
    res.status(403).json({ error: "Acces refuse" });
    return;
  }
  const parsed = CreateQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Données invalides", details: parsed.error.issues });
    return;
  }

  const data = parsed.data;
  const assignedAdvisorUserId =
    role === "pm" ? userId : (data.advisorUserId ?? null);
  const [quote] = await db
    .insert(quotesTable)
    .values({
      serviceType: data.serviceType,
      status: "en_attente",
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientUserId:
        role === "admin" || role === "pm"
          ? (data.clientUserId ?? userId)
          : userId,
      advisorUserId: assignedAdvisorUserId,
      workflowStatus: assignedAdvisorUserId ? "in_progress" : "new",
      reservedAt: assignedAdvisorUserId ? new Date() : null,
      details: data.details,
      budget: data.budget ?? null,
      amount: null,
      notes: null,
    })
    .returning();

  await db.insert(activityTable).values({
    type: "quote_submitted",
    title: "Nouveau devis demandé",
    description: `${data.serviceType} — ${data.clientName}`,
    projectId: null,
  });

  res.status(201).json(formatQuote(quote, role === "admin" || role === "pm"));
});

router.get("/quotes/:id", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  const userId = getUserId(req);
  const parsed = GetQuoteParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const [quote] = await db
    .select()
    .from(quotesTable)
    .where(eq(quotesTable.id, parsed.data.id));
  if (!quote) {
    res.status(404).json({ error: "Devis non trouvé" });
    return;
  }

  if (
    role === "partner" ||
    (role === "client" && quote.clientUserId !== userId) ||
    (role === "pm" &&
      quote.advisorUserId !== null &&
      quote.advisorUserId !== userId)
  ) {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  res.json(formatQuote(quote, role === "admin" || role === "pm"));
});

router.post("/quotes/:id/reserve", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  if (role !== "pm") {
    res.status(403).json({ error: "Accès réservé aux conseillers" });
    return;
  }

  const parsed = GetQuoteParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const advisorUserId = getUserId(req)!;
  const result = await db.transaction(async (database) => {
    // Serialize capacity decisions for one advisor inside PostgreSQL.
    await database.execute(
      sql`select pg_advisory_xact_lock(hashtext(${advisorUserId}))`,
    );

    const capacity = await getAdvisorCapacity(advisorUserId, database);
    if (capacity.full) {
      return { kind: "capacity" as const, capacity };
    }

    const [quote] = await database
      .update(quotesTable)
      .set({
        advisorUserId,
        workflowStatus: "in_progress",
        reservedAt: new Date(),
        lastTreatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(quotesTable.id, parsed.data.id),
          eq(quotesTable.status, "en_attente"),
          isNull(quotesTable.advisorUserId),
        ),
      )
      .returning();

    if (!quote) {
      return { kind: "unavailable" as const };
    }

    await database.insert(activityTable).values({
      type: "quote_reserved",
      title: "Demande réservée",
      description: `${quote.clientName} — conseiller ${advisorUserId}`,
      projectId: null,
    });

    return { kind: "reserved" as const, quote };
  });

  if (result.kind === "capacity") {
    res.status(409).json({
      error: `Capacité conseiller atteinte (${result.capacity.activeProjects}/${result.capacity.limit})`,
    });
    return;
  }
  if (result.kind === "unavailable") {
    res.status(409).json({
      error: "Cette demande est déjà réservée ou n'est plus disponible",
    });
    return;
  }

  res.json(formatQuote(result.quote, true));
});

router.post("/quotes/:id/treatment", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  if (role !== "admin" && role !== "pm") {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  const params = UpdateQuoteTreatmentParams.safeParse({
    id: Number(req.params.id),
  });
  const body = UpdateQuoteTreatmentBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }
  if (!body.success) {
    res.status(400).json({
      error: "Données invalides",
      details: body.error.issues,
    });
    return;
  }

  const [existing] = await db
    .select()
    .from(quotesTable)
    .where(eq(quotesTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Demande introuvable" });
    return;
  }

  const userId = getUserId(req)!;
  if (role === "pm" && existing.advisorUserId !== userId) {
    res.status(403).json({
      error: "Cette demande n’est pas affectée à ce conseiller",
    });
    return;
  }
  if (!existing.advisorUserId && role !== "admin") {
    res.status(409).json({
      error: "La demande doit être réservée avant son traitement",
    });
    return;
  }

  const now = new Date();
  const updates: Record<string, unknown> = {
    lastTreatedAt: now,
    updatedAt: now,
  };
  const labels: Record<typeof body.data.action, string> = {
    client_called: "Client rappelé",
    missed_call: "Appel sans réponse",
    unreachable: "Client injoignable",
    message_sent: "Message envoyé",
    wait: "Dossier mis en attente",
    resume: "Dossier rouvert",
    follow_up: "Suivi démarré",
    close: "Dossier clôturé",
  };

  if (body.data.action === "wait") {
    if (!body.data.waitReason || !body.data.waitUntil) {
      res.status(400).json({
        error: "Le motif et la date de retour sont requis",
      });
      return;
    }
    const waitUntil = new Date(body.data.waitUntil);
    if (
      Number.isNaN(waitUntil.getTime()) ||
      waitUntil.getTime() <= now.getTime()
    ) {
      res.status(400).json({
        error: "La date de retour doit être future",
      });
      return;
    }
    Object.assign(updates, {
      workflowStatus: "waiting",
      waitReason: body.data.waitReason,
      waitUntil,
      followUpUntil: null,
      closedAt: null,
    });
  } else if (body.data.action === "follow_up") {
    if (!body.data.followUpUntil) {
      res.status(400).json({
        error: "La date de fin de suivi est requise",
      });
      return;
    }
    const followUpUntil = new Date(body.data.followUpUntil);
    if (
      Number.isNaN(followUpUntil.getTime()) ||
      followUpUntil.getTime() <= now.getTime()
    ) {
      res.status(400).json({
        error: "La date de fin de suivi doit être future",
      });
      return;
    }
    Object.assign(updates, {
      workflowStatus: "follow_up",
      waitReason: null,
      waitUntil: null,
      followUpUntil,
      closedAt: null,
    });
  } else if (body.data.action === "close") {
    Object.assign(updates, {
      workflowStatus: "closed",
      waitReason: null,
      waitUntil: null,
      followUpUntil: null,
      closedAt: now,
    });
  } else {
    Object.assign(updates, {
      workflowStatus: "in_progress",
      waitReason: null,
      waitUntil: null,
      followUpUntil: null,
      closedAt: null,
    });
  }

  const [updated] = await db
    .update(quotesTable)
    .set(updates)
    .where(eq(quotesTable.id, existing.id))
    .returning();
  const actorName = (await getUserNameAsync(req)) ?? userId;
  await db.insert(activityTable).values({
    type: `quote_treatment_${body.data.action}`,
    title: labels[body.data.action],
    description: `${existing.clientName} — ${actorName}`,
    projectId: null,
  });

  res.json(formatQuote(updated, true));
});

router.patch("/quotes/:id", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  if (role !== "admin" && role !== "pm") {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  const paramsParsed = UpdateQuoteParams.safeParse({
    id: Number(req.params.id),
  });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const bodyParsed = UpdateQuoteBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Données invalides" });
    return;
  }

  const [existing] = await db
    .select()
    .from(quotesTable)
    .where(eq(quotesTable.id, paramsParsed.data.id));
  if (!existing) {
    res.status(404).json({ error: "Devis non trouvé" });
    return;
  }

  const userId = getUserId(req)!;
  if (role === "pm" && existing.advisorUserId !== userId) {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  const updates: any = { ...bodyParsed.data, updatedAt: new Date() };
  if (
    bodyParsed.data.status === "accepte" ||
    bodyParsed.data.status === "refuse"
  ) {
    updates.workflowStatus = "closed";
    updates.closedAt = new Date();
    updates.waitReason = null;
    updates.waitUntil = null;
    updates.followUpUntil = null;
  }
  if (role === "pm") {
    delete updates.advisorUserId;
  }
  const [updated] = await db
    .update(quotesTable)
    .set(updates)
    .where(eq(quotesTable.id, paramsParsed.data.id))
    .returning();

  await db.insert(activityTable).values({
    type: "quote_updated",
    title: "Devis mis à jour",
    description: `Statut: ${updated.status} — ${updated.clientName}`,
    projectId: null,
  });

  res.json(formatQuote(updated, true));
});

export default router;
