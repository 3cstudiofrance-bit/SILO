import { Router, type IRouter } from "express";
import { requireAuth } from "@clerk/express";
import { and, eq, isNotNull, or } from "drizzle-orm";
import {
  activityTable,
  db,
  partnerMissionsTable,
  partnerReviewsTable,
  projectsTable,
} from "@workspace/db";
import { CreatePartnerReviewBody } from "@workspace/api-zod";
import { getRoleAsync, getUserId } from "../lib/roles";

const router: IRouter = Router();

function formatReviewRow(row: {
  mission: typeof partnerMissionsTable.$inferSelect;
  project: typeof projectsTable.$inferSelect;
  review: typeof partnerReviewsTable.$inferSelect | null;
}) {
  return {
    id: row.review?.id ?? null,
    missionId: row.mission.id,
    projectId: row.project.id,
    projectTitle: row.project.title,
    partnerId: row.mission.partnerId,
    partnerName: row.mission.partnerName,
    deliveredAt: row.project.deliveryDate,
    rating: row.review?.rating ?? null,
    comment: row.review?.comment ?? null,
    createdAt: row.review?.createdAt.toISOString() ?? null,
  };
}

router.get("/reviews", requireAuth(), async (req, res) => {
  const userId = getUserId(req)!;
  const role = await getRoleAsync(req);
  if (!["admin", "pm", "partner", "client"].includes(role)) {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  const baseQuery = db
    .select({
      mission: partnerMissionsTable,
      project: projectsTable,
      review: partnerReviewsTable,
    })
    .from(partnerMissionsTable)
    .innerJoin(
      projectsTable,
      eq(partnerMissionsTable.projectId, projectsTable.id),
    )
    .leftJoin(
      partnerReviewsTable,
      eq(partnerReviewsTable.missionId, partnerMissionsTable.id),
    );

  const rows =
    role === "admin"
      ? await baseQuery
      : role === "pm"
        ? await baseQuery.where(eq(projectsTable.advisorUserId, userId))
        : role === "partner"
          ? await baseQuery.where(
              and(
                eq(partnerMissionsTable.partnerId, userId),
                isNotNull(partnerReviewsTable.id),
              ),
            )
          : await baseQuery.where(
              and(
                eq(projectsTable.clientUserId, userId),
                or(
                  isNotNull(partnerReviewsTable.id),
                  and(
                    eq(projectsTable.status, "termine"),
                    eq(partnerMissionsTable.status, "valide"),
                  ),
                ),
              ),
            );

  res.json(rows.map(formatReviewRow));
});

router.post("/reviews", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  const userId = getUserId(req)!;
  if (role !== "client") {
    res.status(403).json({
      error: "L’évaluation doit être déposée par le client du projet",
    });
    return;
  }

  const body = CreatePartnerReviewBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({
      error: "Données invalides",
      details: body.error.issues,
    });
    return;
  }

  const [row] = await db
    .select({
      mission: partnerMissionsTable,
      project: projectsTable,
    })
    .from(partnerMissionsTable)
    .innerJoin(
      projectsTable,
      eq(partnerMissionsTable.projectId, projectsTable.id),
    )
    .where(eq(partnerMissionsTable.id, body.data.missionId))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Mission introuvable" });
    return;
  }
  if (row.project.clientUserId !== userId) {
    res.status(403).json({ error: "Accès refusé pour ce projet" });
    return;
  }
  if (row.project.status !== "termine" || row.mission.status !== "valide") {
    res.status(409).json({
      error: "La prestation doit être clôturée et validée avant son évaluation",
    });
    return;
  }

  const review = await db.transaction(async (database) => {
    const [created] = await database
      .insert(partnerReviewsTable)
      .values({
        missionId: row.mission.id,
        projectId: row.project.id,
        clientUserId: userId,
        partnerId: row.mission.partnerId,
        rating: body.data.rating,
        comment: body.data.comment?.trim() || null,
      })
      .onConflictDoNothing()
      .returning();
    if (!created) return null;

    await database
      .update(partnerMissionsTable)
      .set({ rating: body.data.rating, updatedAt: new Date() })
      .where(eq(partnerMissionsTable.id, row.mission.id));
    await database.insert(activityTable).values({
      type: "partner_reviewed",
      title: "Prestation évaluée par le client",
      description: `${row.mission.partnerName} — ${body.data.rating}/5`,
      projectId: row.project.id,
    });
    return created;
  });

  if (!review) {
    res.status(409).json({
      error: "Cette mission a déjà été évaluée",
    });
    return;
  }

  res.status(201).json(
    formatReviewRow({
      mission: row.mission,
      project: row.project,
      review,
    }),
  );
});

export default router;
