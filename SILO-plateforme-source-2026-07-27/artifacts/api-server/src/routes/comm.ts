import { Router, type IRouter } from "express";
import { requireAuth } from "@clerk/express";
import { SetCommGlobalBlockBody, SetCommAuthorizationBody, SetCommActivationBody } from "@workspace/api-zod";
import { getRoleAsync } from "../lib/roles";
import {
  getGlobalBlock,
  setGlobalBlock,
  getProjectSettings,
  listProjectSettings,
  upsertProjectSettings,
} from "../lib/comm";
import { authorizeProject } from "../lib/project-access";

const router: IRouter = Router();

async function serializeState() {
  const [blocageGlobal, rows] = await Promise.all([getGlobalBlock(), listProjectSettings()]);
  return {
    blocageGlobal,
    projets: rows.map((r) => ({
      projectId: r.projectId,
      adminAutorisePm: r.adminAutorisePm,
      activeParPm: r.activeParPm,
      blocageGlobal,
      directEnabled: !blocageGlobal && r.adminAutorisePm && r.activeParPm,
    })),
  };
}

router.get("/comm/state", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  if (role !== "admin" && role !== "pm") {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }
  res.json(await serializeState());
});

router.get("/comm/projects/:projectId", requireAuth(), async (req, res) => {
  const numericProjectId = Number(req.params.projectId);
  if (!Number.isInteger(numericProjectId) || numericProjectId <= 0) {
    res.status(400).json({ error: "ID projet invalide" });
    return;
  }
  const access = await authorizeProject(req, res, numericProjectId);
  if (!access) return;

  const role = await getRoleAsync(req);
  const projectId = String(numericProjectId);
  const [blocageGlobal, settings] = await Promise.all([getGlobalBlock(), getProjectSettings(projectId)]);
  const directEnabled = !blocageGlobal && settings.adminAutorisePm && settings.activeParPm;

  if (role === "admin" || role === "pm") {
    res.json({
      projectId,
      adminAutorisePm: settings.adminAutorisePm,
      activeParPm: settings.activeParPm,
      blocageGlobal,
      directEnabled,
    });
    return;
  }
  // client / agence : uniquement l'état effectif, jamais le détail des réglages
  res.json({ projectId, adminAutorisePm: null, activeParPm: null, blocageGlobal: null, directEnabled });
});

router.put("/comm/global-block", requireAuth(), async (req, res) => {
  if ((await getRoleAsync(req)) !== "admin") {
    res.status(403).json({ error: "Accès refusé — blocage global réservé à l'admin" });
    return;
  }
  const parsed = SetCommGlobalBlockBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Données invalides", details: parsed.error.issues });
    return;
  }
  await setGlobalBlock(parsed.data.blocked);
  res.json(await serializeState());
});

router.put("/comm/projects/:projectId/authorization", requireAuth(), async (req, res) => {
  if ((await getRoleAsync(req)) !== "admin") {
    res.status(403).json({ error: "Accès refusé — autorisation réservée à l'admin" });
    return;
  }
  const parsed = SetCommAuthorizationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Données invalides", details: parsed.error.issues });
    return;
  }
  const projectId = String(req.params.projectId);
  const prev = await getProjectSettings(projectId);
  // Retirer l'autorisation réinitialise l'activation PM (retour au défaut sûr).
  await upsertProjectSettings(projectId, {
    adminAutorisePm: parsed.data.authorized,
    activeParPm: parsed.data.authorized ? prev.activeParPm : false,
  });
  res.json(await serializeState());
});

router.put("/comm/projects/:projectId/activation", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  if (role !== "pm") {
    res.status(403).json({ error: "Accès refusé — activation réservée au chef de projet" });
    return;
  }
  const parsed = SetCommActivationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Données invalides", details: parsed.error.issues });
    return;
  }
  const projectId = String(req.params.projectId);
  const [blocageGlobal, settings] = await Promise.all([getGlobalBlock(), getProjectSettings(projectId)]);
  if (parsed.data.active && (!settings.adminAutorisePm || blocageGlobal)) {
    res.status(403).json({
      error: blocageGlobal
        ? "Blocage global administrateur en vigueur"
        : "L'administration doit d'abord autoriser la communication directe sur ce projet",
    });
    return;
  }
  await upsertProjectSettings(projectId, {
    adminAutorisePm: settings.adminAutorisePm,
    activeParPm: parsed.data.active,
  });
  res.json({
    projectId,
    adminAutorisePm: settings.adminAutorisePm,
    activeParPm: parsed.data.active,
    blocageGlobal,
    directEnabled: !blocageGlobal && settings.adminAutorisePm && parsed.data.active,
  });
});

export default router;
