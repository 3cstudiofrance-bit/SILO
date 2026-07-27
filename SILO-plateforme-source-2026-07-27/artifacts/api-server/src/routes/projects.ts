import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { eq, and } from "drizzle-orm";
import { db } from "@workspace/db";
import { projectsTable, activityTable } from "@workspace/db";
import {
  ListProjectsQueryParams,
  CreateProjectBody,
  UpdateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  DeleteProjectParams,
} from "@workspace/api-zod";
import { getRoleAsync, getUserId } from "../lib/roles";
import { getAdvisorCapacity } from "../lib/advisor-capacity";

const router = Router();

function formatProject(p: any) {
  return {
    id: p.id,
    title: p.title,
    type: p.type,
    status: p.status,
    clientName: p.clientName,
    clientEmail: p.clientEmail,
    clientUserId: p.clientUserId,
    advisorUserId: p.advisorUserId,
    description: p.description,
    amount: p.amount,
    shootingDate: p.shootingDate,
    deliveryDate: p.deliveryDate,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/projects", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  const userId = getUserId(req)!;
  const parsed = ListProjectsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  let projects;

  if (role === "admin" || role === "pm") {
    const conditions: any[] = [];
    if (role === "pm") {
      conditions.push(eq(projectsTable.advisorUserId, userId));
    }
    if (params.status) conditions.push(eq(projectsTable.status, params.status));
    if (params.type) conditions.push(eq(projectsTable.type, params.type));
    projects = conditions.length > 0
      ? await db.select().from(projectsTable).where(and(...conditions))
      : await db.select().from(projectsTable);
  } else if (role === "partner") {
    // Partners access projects only through missions
    res.status(403).json({ error: "Accès refusé — utilisez /partner/missions" });
    return;
  } else {
    // Client — uniquement ses propres projets
    projects = await db.select().from(projectsTable).where(eq(projectsTable.clientUserId, userId));
  }

  res.json(projects.map(formatProject));
});

router.post("/projects", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  if (role !== "admin" && role !== "pm") {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Données invalides", details: parsed.error.issues });
    return;
  }

  const data = parsed.data;
  const advisorUserId =
    role === "pm" ? getUserId(req)! : (data.advisorUserId ?? null);
  if (advisorUserId) {
    const capacity = await getAdvisorCapacity(advisorUserId);
    if (capacity.full) {
      res.status(409).json({
        error: `Capacite conseiller atteinte (${capacity.activeProjects}/${capacity.limit})`,
      });
      return;
    }
  }

  const [project] = await db.insert(projectsTable).values({
    title: data.title,
    type: data.type,
    status: "lead",
    clientName: data.clientName,
    clientEmail: data.clientEmail,
    clientUserId: data.clientUserId ?? null,
    advisorUserId,
    description: data.description ?? null,
    amount: data.amount ?? null,
    shootingDate: data.shootingDate ? data.shootingDate.toISOString().slice(0, 10) : null,
    deliveryDate: data.deliveryDate ? data.deliveryDate.toISOString().slice(0, 10) : null,
  }).returning();

  await db.insert(activityTable).values({
    type: "project_created",
    title: "Nouveau projet créé",
    description: `${project.title} — ${project.clientName}`,
    projectId: project.id,
  });

  res.status(201).json(formatProject(project));
});

router.get("/projects/:id", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  const userId = getUserId(req);
  const parsed = GetProjectParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, parsed.data.id));

  if (!project) {
    res.status(404).json({ error: "Projet non trouvé" });
    return;
  }

  if (role === "partner") {
    res.status(403).json({ error: "Acces refuse - utilisez vos missions" });
    return;
  }

  if (role === "client" && project.clientUserId !== userId) {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }
  if (role === "pm" && project.advisorUserId !== userId) {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  res.json(formatProject(project));
});

router.patch("/projects/:id", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  if (role !== "admin" && role !== "pm") {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  const parsed = UpdateProjectParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const bodyParsed = UpdateProjectBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Données invalides" });
    return;
  }

  const [existing] = await db.select().from(projectsTable).where(eq(projectsTable.id, parsed.data.id));
  if (!existing) {
    res.status(404).json({ error: "Projet non trouvé" });
    return;
  }

  const userId = getUserId(req)!;
  if (role === "pm" && existing.advisorUserId !== userId) {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  const requestedAdvisorUserId =
    role === "admin"
      ? bodyParsed.data.advisorUserId
      : existing.advisorUserId;
  if (
    requestedAdvisorUserId &&
    requestedAdvisorUserId !== existing.advisorUserId
  ) {
    const capacity = await getAdvisorCapacity(requestedAdvisorUserId);
    if (capacity.full) {
      res.status(409).json({
        error: `Capacite conseiller atteinte (${capacity.activeProjects}/${capacity.limit})`,
      });
      return;
    }
  }

  const updates: any = { ...bodyParsed.data, updatedAt: new Date() };
  if (role === "pm") {
    delete updates.advisorUserId;
  }
  const [updated] = await db.update(projectsTable).set(updates).where(eq(projectsTable.id, parsed.data.id)).returning();

  await db.insert(activityTable).values({
    type: "project_updated",
    title: "Projet mis à jour",
    description: `${updated.title} — statut: ${updated.status}`,
    projectId: updated.id,
  });

  res.json(formatProject(updated));
});

router.delete("/projects/:id", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  if (role !== "admin") {
    res.status(403).json({ error: "Accès refusé — suppression admin seulement" });
    return;
  }

  const parsed = DeleteProjectParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  await db.delete(projectsTable).where(eq(projectsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
