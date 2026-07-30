import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { desc } from "drizzle-orm";
import { z } from "zod/v4";
import { db, spaceAccessLogsTable } from "@workspace/db";
import {
  getRoleAsync,
  getUserEmailAsync,
  getUserId,
  getUserNameAsync,
} from "../lib/roles";

const router = Router();

router.get("/auth/me", requireAuth(), async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  const role = await getRoleAsync(req);
  res.setHeader("Cache-Control", "private, no-store");
  res.json({ userId, role });
});

const spaceAccessSchema = z.object({
  space: z.enum(["admin", "pm", "partner", "client"]),
  path: z.string().min(1).max(240).startsWith("/"),
});

router.post("/auth/space-access", requireAuth(), async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  const parsed = spaceAccessSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Espace ou chemin invalide" });
    return;
  }

  const role = await getRoleAsync(req);
  if (role !== "admin" && role !== parsed.data.space) {
    res.status(403).json({ error: "Accès non autorisé à cet espace" });
    return;
  }

  const [userEmail, userName] = await Promise.all([
    getUserEmailAsync(req),
    getUserNameAsync(req),
  ]);

  await db.insert(spaceAccessLogsTable).values({
    userId,
    userEmail,
    userName,
    role,
    space: parsed.data.space,
    path: parsed.data.path,
  });

  res.status(201).json({ recorded: true });
});

router.get("/auth/space-access", requireAuth(), async (req, res) => {
  if ((await getRoleAsync(req)) !== "admin") {
    res.status(403).json({ error: "Accès réservé à l’administration" });
    return;
  }

  const limit = Math.min(
    Math.max(Number.parseInt(String(req.query.limit ?? "100"), 10) || 100, 1),
    250,
  );
  const logs = await db
    .select()
    .from(spaceAccessLogsTable)
    .orderBy(desc(spaceAccessLogsTable.accessedAt))
    .limit(limit);

  res.json(logs);
});

export default router;
