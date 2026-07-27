import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { deliverablesTable, activityTable } from "@workspace/db";
import {
  ListDeliverablesParams,
  AddDeliverableParams,
  AddDeliverableBody,
  DeleteDeliverableParams,
  ReviewDeliverableAsClientBody,
  ReviewDeliverableAsClientParams,
  ReviewDeliverableBody,
  ReviewDeliverableParams,
} from "@workspace/api-zod";
import { authorizeProject } from "../lib/project-access";
import { getUserId } from "../lib/roles";
import { resolveFeatureFlagForRequest } from "../lib/feature-flags";

const router = Router();

function formatDeliverable(d: any) {
  return {
    id: d.id,
    projectId: d.projectId,
    name: d.name,
    url: d.url,
    type: d.type,
    size: d.size,
    status: d.status,
    version: d.version,
    submittedByUserId: d.submittedByUserId,
    reviewedByUserId: d.reviewedByUserId,
    reviewedAt: d.reviewedAt?.toISOString() ?? null,
    reviewNotes: d.reviewNotes,
    clientStatus: d.clientStatus,
    clientReviewedByUserId: d.clientReviewedByUserId,
    clientReviewedAt: d.clientReviewedAt?.toISOString() ?? null,
    clientReviewNotes: d.clientReviewNotes,
    createdAt: d.createdAt.toISOString(),
  };
}

router.get("/projects/:id/deliverables", requireAuth(), async (req, res) => {
  const parsed = ListDeliverablesParams.safeParse({
    id: Number(req.params.id),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const access = await authorizeProject(req, res, parsed.data.id);
  if (!access) return;

  const conditions = [eq(deliverablesTable.projectId, parsed.data.id)];
  if (access.role === "client") {
    conditions.push(eq(deliverablesTable.status, "approved"));
  }
  if (access.role === "partner") {
    conditions.push(eq(deliverablesTable.submittedByUserId, access.userId));
  }

  const deliverables = await db
    .select()
    .from(deliverablesTable)
    .where(and(...conditions));
  res.json(deliverables.map(formatDeliverable));
});

router.post("/projects/:id/deliverables", requireAuth(), async (req, res) => {
  const paramsParsed = AddDeliverableParams.safeParse({
    id: Number(req.params.id),
  });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const bodyParsed = AddDeliverableBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res
      .status(400)
      .json({ error: "Données invalides", details: bodyParsed.error.issues });
    return;
  }

  const access = await authorizeProject(req, res, paramsParsed.data.id);
  if (!access) return;
  if (access.role === "client") {
    res
      .status(403)
      .json({ error: "Ajout de livrable reserve aux equipes du projet" });
    return;
  }

  const [deliverable] = await db
    .insert(deliverablesTable)
    .values({
      projectId: paramsParsed.data.id,
      name: bodyParsed.data.name,
      url: bodyParsed.data.url,
      type: bodyParsed.data.type,
      size: bodyParsed.data.size ?? null,
      status: "pending_review",
      version: bodyParsed.data.version ?? 1,
      submittedByUserId: access.userId,
    })
    .returning();

  await db.insert(activityTable).values({
    type: "deliverable_added",
    title: "Livrable ajouté",
    description: `${bodyParsed.data.name} — ${access.project.title}`,
    projectId: access.project.id,
  });

  res.status(201).json(formatDeliverable(deliverable));
});

router.patch("/deliverables/:id", requireAuth(), async (req, res) => {
  const params = ReviewDeliverableParams.safeParse({
    id: Number(req.params.id),
  });
  const body = ReviewDeliverableBody.safeParse(req.body);
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
  if (body.data.status === "changes_requested" && !body.data.notes?.trim()) {
    res.status(400).json({
      error: "Un motif est requis pour demander des corrections",
    });
    return;
  }

  const [deliverable] = await db
    .select()
    .from(deliverablesTable)
    .where(eq(deliverablesTable.id, params.data.id));
  if (!deliverable) {
    res.status(404).json({ error: "Livrable non trouvé" });
    return;
  }

  const access = await authorizeProject(req, res, deliverable.projectId);
  if (!access) return;
  if (access.role !== "admin" && access.role !== "pm") {
    res.status(403).json({ error: "Validation réservée à SILO" });
    return;
  }

  const [updated] = await db
    .update(deliverablesTable)
    .set({
      status: body.data.status,
      reviewNotes: body.data.notes?.trim() || null,
      reviewedByUserId: getUserId(req),
      reviewedAt: new Date(),
      ...(body.data.status === "approved"
        ? {
            clientStatus: "pending",
            clientReviewedByUserId: null,
            clientReviewedAt: null,
            clientReviewNotes: null,
          }
        : {}),
    })
    .where(eq(deliverablesTable.id, params.data.id))
    .returning();

  await db.insert(activityTable).values({
    type: "deliverable_reviewed",
    title:
      updated.status === "approved"
        ? "Livrable validé"
        : "Corrections demandées",
    description: `${updated.name} — ${access.project.title}`,
    projectId: access.project.id,
  });

  res.json(formatDeliverable(updated));
});

router.patch(
  "/deliverables/:id/client-review",
  requireAuth(),
  async (req, res) => {
    const params = ReviewDeliverableAsClientParams.safeParse({
      id: Number(req.params.id),
    });
    const body = ReviewDeliverableAsClientBody.safeParse(req.body);
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
    if (body.data.status === "changes_requested" && !body.data.notes?.trim()) {
      res.status(400).json({
        error: "Un motif est requis pour demander des corrections",
      });
      return;
    }

    const [deliverable] = await db
      .select()
      .from(deliverablesTable)
      .where(eq(deliverablesTable.id, params.data.id));
    if (!deliverable) {
      res.status(404).json({ error: "Livrable non trouvé" });
      return;
    }

    const access = await authorizeProject(req, res, deliverable.projectId);
    if (!access) return;
    if (access.role !== "client") {
      res.status(403).json({
        error: "Validation réservée au client du projet",
      });
      return;
    }
    if (
      !(await resolveFeatureFlagForRequest(req, "validation_livrables_client", {
        projectId: String(deliverable.projectId),
      }))
    ) {
      res.status(403).json({
        error: "La validation client n'est pas activée pour ce projet",
      });
      return;
    }
    if (deliverable.status !== "approved") {
      res.status(409).json({
        error:
          "Le livrable doit être approuvé par SILO avant la validation client",
      });
      return;
    }

    const reviewedAt = new Date();
    const [updated] = await db
      .update(deliverablesTable)
      .set({
        clientStatus: body.data.status,
        clientReviewNotes: body.data.notes?.trim() || null,
        clientReviewedByUserId: access.userId,
        clientReviewedAt: reviewedAt,
      })
      .where(
        and(
          eq(deliverablesTable.id, deliverable.id),
          eq(deliverablesTable.status, "approved"),
        ),
      )
      .returning();

    await db.insert(activityTable).values({
      type: "deliverable_client_reviewed",
      title:
        updated.clientStatus === "approved"
          ? "Livrable validé par le client"
          : "Corrections demandées par le client",
      description: `${updated.name} — ${access.project.title}`,
      projectId: access.project.id,
    });

    res.json(formatDeliverable(updated));
  },
);

router.delete("/deliverables/:id", requireAuth(), async (req, res) => {
  const parsed = DeleteDeliverableParams.safeParse({
    id: Number(req.params.id),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const [deliverable] = await db
    .select()
    .from(deliverablesTable)
    .where(eq(deliverablesTable.id, parsed.data.id));
  if (!deliverable) {
    res.status(404).json({ error: "Livrable non trouve" });
    return;
  }

  const access = await authorizeProject(req, res, deliverable.projectId);
  if (!access) return;
  if (access.role !== "admin" && access.role !== "pm") {
    res.status(403).json({ error: "Suppression reservee a SILO" });
    return;
  }

  await db
    .delete(deliverablesTable)
    .where(eq(deliverablesTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
