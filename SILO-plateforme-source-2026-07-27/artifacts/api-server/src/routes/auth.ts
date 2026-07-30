import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { getRoleAsync, getUserId } from "../lib/roles";

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

export default router;
