import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { commentsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { authorizeProject } from "../lib/project-access";
import { getUserNameAsync } from "../lib/roles";

const router = Router();

const idSchema = z.coerce.number().int().positive();
const commentTypeEnum = z.enum(["comment", "correction"]);

router.get("/projects/:id/comments", requireAuth(), async (req, res) => {
  const idResult = idSchema.safeParse(req.params.id);
  if (!idResult.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  const access = await authorizeProject(req, res, idResult.data);
  if (!access) return;

  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.projectId, idResult.data))
    .orderBy(commentsTable.createdAt);

  res.json(comments);
});

router.post("/projects/:id/comments", requireAuth(), async (req, res) => {
  const idResult = idSchema.safeParse(req.params.id);
  if (!idResult.success) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  const access = await authorizeProject(req, res, idResult.data);
  if (!access) return;

  const bodySchema = z.object({
    content: z.string().min(1).max(2000),
    type: commentTypeEnum.default("comment"),
    // Tolere temporairement l'ancien contrat client, mais ne lui fait pas confiance.
    authorName: z.string().min(1).max(200).optional(),
  });

  const bodyResult = bodySchema.safeParse(req.body);
  if (!bodyResult.success) {
    res.status(400).json({ error: "Invalid request body", details: bodyResult.error.issues });
    return;
  }

  const authorName =
    (await getUserNameAsync(req)) ??
    (access.role === "partner"
      ? "Partenaire"
      : access.role === "pm"
        ? "Conseiller SILO"
        : access.role === "admin"
          ? "Administration"
          : "Client");

  const [comment] = await db
    .insert(commentsTable)
    .values({
      projectId: idResult.data,
      userId: access.userId,
      authorName,
      content: bodyResult.data.content,
      type: bodyResult.data.type,
      isAdmin: access.role === "admin",
    })
    .returning();

  res.status(201).json(comment);
});

export default router;
