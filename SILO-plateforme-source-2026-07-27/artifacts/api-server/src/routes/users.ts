import { Router, type IRouter } from "express";
import { clerkClient, requireAuth } from "@clerk/express";
import {
  db,
  partnerMissionsTable,
  projectsTable,
} from "@workspace/db";
import { getRoleAsync, roleFromClerkUser } from "../lib/roles";

const router: IRouter = Router();

router.get("/users", requireAuth(), async (req, res) => {
  if ((await getRoleAsync(req)) !== "admin") {
    res.status(403).json({ error: "Acces reserve a l'administration" });
    return;
  }

  const [clerkUsers, projects, missions] = await Promise.all([
    clerkClient.users.getUserList({ limit: 100, orderBy: "-created_at" }),
    db
      .select({
        clientUserId: projectsTable.clientUserId,
        advisorUserId: projectsTable.advisorUserId,
      })
      .from(projectsTable),
    db
      .select({ partnerId: partnerMissionsTable.partnerId })
      .from(partnerMissionsTable),
  ]);

  const projectCounts = new Map<string, number>();
  for (const project of projects) {
    for (const userId of [project.clientUserId, project.advisorUserId]) {
      if (!userId) continue;
      projectCounts.set(userId, (projectCounts.get(userId) ?? 0) + 1);
    }
  }
  for (const mission of missions) {
    projectCounts.set(
      mission.partnerId,
      (projectCounts.get(mission.partnerId) ?? 0) + 1,
    );
  }

  res.json(
    clerkUsers.data.map((user) => {
      const email =
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        "";
      const candidateName =
        user.fullName ??
        [user.firstName, user.lastName].filter(Boolean).join(" ");
      const name = candidateName || email || user.id;

      return {
        id: user.id,
        name,
        email,
        role: roleFromClerkUser(user),
        status: user.banned || user.locked ? "suspended" : "active",
        joinedAt: new Date(user.createdAt).toISOString(),
        projects: projectCounts.get(user.id) ?? 0,
        avatarUrl: user.imageUrl || null,
      };
    }),
  );
});

export default router;
