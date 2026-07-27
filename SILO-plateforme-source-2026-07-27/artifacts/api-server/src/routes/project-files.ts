import { Router, type IRouter } from "express";
import { requireAuth } from "@clerk/express";
import { desc, eq } from "drizzle-orm";
import { activityTable, db, projectFilesTable } from "@workspace/db";
import {
  AddProjectFileBody,
  AddProjectFileParams,
  ListProjectFilesParams,
} from "@workspace/api-zod";
import { authorizeProject } from "../lib/project-access";

const router: IRouter = Router();

function formatProjectFile(file: typeof projectFilesTable.$inferSelect) {
  return {
    id: file.id,
    projectId: file.projectId,
    name: file.name,
    storageBucket: file.storageBucket,
    storagePath: file.storagePath,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    sourceRole: file.sourceRole,
    createdAt: file.createdAt.toISOString(),
  };
}

router.get("/projects/:id/files", requireAuth(), async (req, res) => {
  const params = ListProjectFilesParams.safeParse({
    id: Number(req.params.id),
  });
  if (!params.success) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }
  const access = await authorizeProject(req, res, params.data.id);
  if (!access) return;

  const files = await db
    .select()
    .from(projectFilesTable)
    .where(eq(projectFilesTable.projectId, params.data.id))
    .orderBy(desc(projectFilesTable.createdAt));
  res.json(files.map(formatProjectFile));
});

router.post("/projects/:id/files", requireAuth(), async (req, res) => {
  const params = AddProjectFileParams.safeParse({
    id: Number(req.params.id),
  });
  const body = AddProjectFileBody.safeParse(req.body);
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

  const access = await authorizeProject(req, res, params.data.id);
  if (!access) return;
  if (
    access.role !== "client" &&
    access.role !== "pm" &&
    access.role !== "admin"
  ) {
    res.status(403).json({
      error: "Dépôt de ressource réservé au client et à SILO",
    });
    return;
  }
  if (
    !body.data.storagePath.startsWith(`${params.data.id}/`) ||
    body.data.storagePath.includes("..")
  ) {
    res.status(400).json({
      error: "Le chemin de stockage ne correspond pas au projet",
    });
    return;
  }

  const [file] = await db
    .insert(projectFilesTable)
    .values({
      projectId: params.data.id,
      name: body.data.name,
      storageBucket: body.data.storageBucket,
      storagePath: body.data.storagePath,
      mimeType: body.data.mimeType ?? null,
      sizeBytes: body.data.sizeBytes,
      uploadedByUserId: access.userId,
      sourceRole: access.role,
    })
    .returning();

  await db.insert(activityTable).values({
    type: "project_file_added",
    title: "Ressource projet ajoutée",
    description: `${file.name} — ${access.project.title}`,
    projectId: access.project.id,
  });

  res.status(201).json(formatProjectFile(file));
});

export default router;
