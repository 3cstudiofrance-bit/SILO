import { Router, type IRouter } from "express";
import { requireAuth } from "@clerk/express";
import { and, count, eq, inArray } from "drizzle-orm";
import { db, partnersTable, type Partner } from "@workspace/db";
import {
  CreatePartnerBody,
  UpdatePartnerBody,
  UpdatePartnerParams,
} from "@workspace/api-zod";
import { ADVISOR_PARTNER_PORTFOLIO_TARGET } from "@workspace/domain";
import { getRoleAsync, getUserId } from "../lib/roles";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function formatPartner(partner: Partner) {
  return {
    ...partner,
    createdAt: partner.createdAt.toISOString(),
    updatedAt: partner.updatedAt.toISOString(),
  };
}

async function warnOnAdvisorPortfolio(advisorUserId: string | null) {
  if (!advisorUserId) return;

  const [row] = await db
    .select({ value: count() })
    .from(partnersTable)
    .where(
      and(
        eq(partnersTable.advisorUserId, advisorUserId),
        inArray(partnersTable.status, ["pending", "active"]),
      ),
    );

  const portfolioSize = row?.value ?? 0;
  if (portfolioSize > ADVISOR_PARTNER_PORTFOLIO_TARGET) {
    logger.warn(
      {
        advisorUserId,
        portfolioSize,
        target: ADVISOR_PARTNER_PORTFOLIO_TARGET,
      },
      "Advisor partner portfolio target exceeded",
    );
  }
}

router.get("/partners", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  const userId = getUserId(req)!;

  let partners: Partner[];
  if (role === "admin") {
    partners = await db.select().from(partnersTable);
  } else if (role === "pm") {
    partners = await db
      .select()
      .from(partnersTable)
      .where(eq(partnersTable.advisorUserId, userId));
  } else if (role === "partner") {
    partners = await db
      .select()
      .from(partnersTable)
      .where(eq(partnersTable.userId, userId));
  } else {
    res.status(403).json({ error: "Acces refuse" });
    return;
  }

  res.json(partners.map(formatPartner));
});

router.post("/partners", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  if (role !== "admin") {
    res.status(403).json({ error: "Creation reservee a l'administration" });
    return;
  }

  const parsed = CreatePartnerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Donnees invalides",
      details: parsed.error.issues,
    });
    return;
  }

  const [partner] = await db
    .insert(partnersTable)
    .values({
      ...parsed.data,
      phone: parsed.data.phone ?? null,
      city: parsed.data.city ?? null,
      specialties: parsed.data.specialties ?? [],
      portfolioUrl: parsed.data.portfolioUrl ?? null,
      advisorUserId: parsed.data.advisorUserId ?? null,
    })
    .returning();

  if (!partner) {
    res.status(500).json({ error: "Le partenaire n'a pas ete cree" });
    return;
  }

  await warnOnAdvisorPortfolio(partner.advisorUserId);
  res.status(201).json(formatPartner(partner));
});

router.patch("/partners/:id", requireAuth(), async (req, res) => {
  const params = UpdatePartnerParams.safeParse({
    id: Number(req.params.id),
  });
  const body = UpdatePartnerBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Donnees invalides" });
    return;
  }

  const [existing] = await db
    .select()
    .from(partnersTable)
    .where(eq(partnersTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Partenaire introuvable" });
    return;
  }

  const role = await getRoleAsync(req);
  const userId = getUserId(req)!;
  if (
    (role === "pm" && existing.advisorUserId !== userId) ||
    (role === "partner" && existing.userId !== userId) ||
    role === "client"
  ) {
    res.status(403).json({ error: "Acces refuse" });
    return;
  }

  const updates: Record<string, unknown> = {
    ...body.data,
    updatedAt: new Date(),
  };
  if (role === "pm") {
    delete updates.advisorUserId;
  }
  if (role === "partner") {
    delete updates.advisorUserId;
    delete updates.status;
  }

  const [updated] = await db
    .update(partnersTable)
    .set(updates)
    .where(eq(partnersTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(500).json({ error: "Le partenaire n'a pas ete mis a jour" });
    return;
  }

  await warnOnAdvisorPortfolio(updated.advisorUserId);
  res.json(formatPartner(updated));
});

export default router;
