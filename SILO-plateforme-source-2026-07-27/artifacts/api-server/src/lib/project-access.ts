import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  partnerMissionsTable,
  projectsTable,
  type Project,
} from "@workspace/db";
import { getRoleAsync, getUserId, type Role } from "./roles";

export interface ProjectAccess {
  project: Project;
  role: Role;
  userId: string;
  relation: "admin" | "pm" | "client" | "partner";
}

/** Autorisation commune aux ressources d'un projet. */
export async function authorizeProject(
  req: Request,
  res: Response,
  projectId: number,
): Promise<ProjectAccess | null> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Authentification requise" });
    return null;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));

  if (!project) {
    res.status(404).json({ error: "Projet non trouve" });
    return null;
  }

  const role = await getRoleAsync(req);
  if (role === "admin") {
    return { project, role, userId, relation: "admin" };
  }

  if (role === "pm" && project.advisorUserId === userId) {
    return { project, role, userId, relation: "pm" };
  }

  if (role === "client" && project.clientUserId === userId) {
    return { project, role, userId, relation: "client" };
  }

  if (role === "partner") {
    const [mission] = await db
      .select({ id: partnerMissionsTable.id })
      .from(partnerMissionsTable)
      .where(
        and(
          eq(partnerMissionsTable.projectId, projectId),
          eq(partnerMissionsTable.partnerId, userId),
        ),
      )
      .limit(1);

    if (mission) {
      return { project, role, userId, relation: "partner" };
    }
  }

  res.status(403).json({ error: "Acces refuse pour ce projet" });
  return null;
}
