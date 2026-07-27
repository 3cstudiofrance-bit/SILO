import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@workspace/db";
import { projectsTable, quotesTable, activityTable } from "@workspace/db";
import { getRoleAsync, getUserId } from "../lib/roles";

const router = Router();

router.get("/dashboard/stats", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  if (role !== "admin" && role !== "pm") {
    res.status(403).json({ error: "Accès réservé à l'administration" });
    return;
  }

  const userId = getUserId(req)!;
  const projects =
    role === "admin"
      ? await db.select().from(projectsTable)
      : await db
          .select()
          .from(projectsTable)
          .where(eq(projectsTable.advisorUserId, userId));
  const quotes =
    role === "admin"
      ? await db.select().from(quotesTable)
      : await db
          .select()
          .from(quotesTable)
          .where(eq(quotesTable.advisorUserId, userId));

  const activeStatuses = ["production", "post_production", "livraison_agence", "livraison_client", "verification"];
  const activeProjects = projects.filter(p => activeStatuses.includes(p.status)).length;
  const deliveredProjects = projects.filter(p => p.status === "termine" || p.status === "validation_finale").length;
  const pendingQuotes = quotes.filter(q => q.status === "en_attente").length;
  const revenueTotal = projects.reduce((sum, p) => sum + (p.amount || 0), 0);

  const byType: Record<string, number> = {};
  for (const p of projects) {
    byType[p.type] = (byType[p.type] || 0) + 1;
  }

  const byStatus: Record<string, number> = {};
  for (const p of projects) {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
  }

  res.json({
    totalProjects: projects.length,
    activeProjects,
    pendingQuotes,
    deliveredProjects,
    revenueTotal,
    projectsByType: Object.entries(byType).map(([type, count]) => ({ type, count })),
    projectsByStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
  });
});

router.get("/dashboard/recent-activity", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  if (role !== "admin" && role !== "pm") {
    res.status(403).json({ error: "Accès réservé à l'administration" });
    return;
  }

  let activities;
  if (role === "admin") {
    activities = await db
      .select()
      .from(activityTable)
      .orderBy(desc(activityTable.createdAt))
      .limit(20);
  } else {
    const projectRows = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(eq(projectsTable.advisorUserId, getUserId(req)!));
    const projectIds = projectRows.map((project) => project.id);
    activities = projectIds.length
      ? await db
          .select()
          .from(activityTable)
          .where(inArray(activityTable.projectId, projectIds))
          .orderBy(desc(activityTable.createdAt))
          .limit(20)
      : [];
  }
  res.json(activities.map(a => ({
    id: a.id,
    type: a.type,
    title: a.title,
    description: a.description,
    projectId: a.projectId,
    createdAt: a.createdAt.toISOString(),
  })));
});

export default router;
