import { Router } from "express";
import { requireAuth } from "@clerk/express";
import {
  db,
  partnerMissionsTable,
  partnersTable,
  projectsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getRoleAsync, getUserId } from "../lib/roles";
import { authorizeProject } from "../lib/project-access";

const router = Router();

const idSchema = z.coerce.number().int().positive();

router.get("/partner/missions", requireAuth(), async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }

  const role = await getRoleAsync(req);
  if (role !== "admin" && role !== "pm" && role !== "partner") {
    res.status(403).json({ error: "Acces refuse" });
    return;
  }

  if (role === "admin") {
    const missions = await db
      .select()
      .from(partnerMissionsTable)
      .orderBy(partnerMissionsTable.createdAt);
    res.json(missions);
    return;
  }

  if (role === "pm") {
    const rows = await db
      .select({ mission: partnerMissionsTable })
      .from(partnerMissionsTable)
      .innerJoin(
        projectsTable,
        eq(partnerMissionsTable.projectId, projectsTable.id),
      )
      .where(eq(projectsTable.advisorUserId, userId))
      .orderBy(partnerMissionsTable.createdAt);
    res.json(rows.map((row) => row.mission));
    return;
  }

  const missions = await db
        .select()
        .from(partnerMissionsTable)
        .where(eq(partnerMissionsTable.partnerId, userId))
        .orderBy(partnerMissionsTable.createdAt);

  res.json(missions);
});

router.post("/partner/missions", requireAuth(), async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }

  const role = await getRoleAsync(req);
  if (role !== "admin" && role !== "pm") {
    res.status(403).json({ error: "Attribution reservee a SILO" });
    return;
  }

  const bodySchema = z.object({
    projectId: z.number().int().positive().optional(),
    partnerId: z.string().min(1).max(200),
    partnerName: z.string().min(1).max(200),
    title: z.string().min(1).max(300),
    brief: z.string().max(5000).optional(),
    dueDate: z.string().max(20).optional(),
    amount: z.number().positive().optional(),
  });

  const bodyResult = bodySchema.safeParse(req.body);
  if (!bodyResult.success) {
    res.status(400).json({ error: "Invalid request body", details: bodyResult.error.issues });
    return;
  }

  if (role === "pm" && !bodyResult.data.projectId) {
    res.status(400).json({
      error: "Un projet assigné est requis pour créer une mission",
    });
    return;
  }
  if (bodyResult.data.projectId) {
    const access = await authorizeProject(
      req,
      res,
      bodyResult.data.projectId,
    );
    if (!access) return;
  }

  const [partner] = await db
    .select()
    .from(partnersTable)
    .where(eq(partnersTable.userId, bodyResult.data.partnerId));
  if (!partner || partner.status !== "active") {
    res.status(400).json({
      error: "Le partenaire doit être actif avant toute attribution",
    });
    return;
  }
  if (role === "pm" && partner.advisorUserId !== userId) {
    res.status(403).json({
      error: "Ce partenaire n'appartient pas à votre portefeuille",
    });
    return;
  }

  const [mission] = await db
    .insert(partnerMissionsTable)
    .values({ ...bodyResult.data, partnerName: partner.name })
    .returning();

  res.status(201).json(mission);
});

router.patch("/partner/missions/:id", requireAuth(), async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }

  const idResult = idSchema.safeParse(req.params.id);
  if (!idResult.success) {
    res.status(400).json({ error: "Invalid mission id" });
    return;
  }

  const role = await getRoleAsync(req);
  if (role !== "admin" && role !== "pm" && role !== "partner") {
    res.status(403).json({ error: "Acces refuse" });
    return;
  }

  const statusEnum = z.enum(["en_attente", "accepte", "en_cours", "livre", "valide", "refuse"]);
  const bodySchema = role === "admin" || role === "pm"
    ? z.object({ status: statusEnum.optional(), notes: z.string().max(2000).optional(), rating: z.number().min(0).max(5).optional() })
    : z.object({ status: z.enum(["accepte", "en_cours", "livre", "refuse"]).optional() });

  const bodyResult = bodySchema.safeParse(req.body);
  if (!bodyResult.success) {
    res.status(400).json({ error: "Invalid request body", details: bodyResult.error.issues });
    return;
  }

  const [existing] = await db
    .select()
    .from(partnerMissionsTable)
    .where(eq(partnerMissionsTable.id, idResult.data));

  if (!existing) {
    res.status(404).json({ error: "Mission not found" });
    return;
  }

  if (role === "partner" && existing.partnerId !== userId) {
    res.status(403).json({ error: "Acces refuse" });
    return;
  }
  if (role === "pm") {
    if (!existing.projectId) {
      res.status(403).json({ error: "Mission sans projet assigné" });
      return;
    }
    const access = await authorizeProject(req, res, existing.projectId);
    if (!access) return;
  }

  const [updated] = await db
    .update(partnerMissionsTable)
    .set({ ...bodyResult.data, updatedAt: new Date() })
    .where(eq(partnerMissionsTable.id, idResult.data))
    .returning();

  res.json(updated);
});

export default router;
