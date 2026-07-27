import { Router, type IRouter } from "express";
import { requireAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import {
  db,
  featureFlagGlobalsTable,
  featureFlagOverridesTable,
  featureFlagDelegationsTable,
} from "@workspace/db";
import {
  CreateFeatureFlagOverrideBody,
  SetGlobalFeatureFlagBody,
  SetFeatureFlagDelegationBody,
} from "@workspace/api-zod";
import { featureDef } from "../lib/feature-defs";
import { getRoleAsync } from "../lib/roles";
import {
  loadFeatureFlagsState,
  resolveAllFeatureFlagsForRequest,
  serializeFeatureFlagsState,
} from "../lib/feature-flags";

const router: IRouter = Router();

router.get("/feature-flags", requireAuth(), async (req, res) => {
  const flags = await resolveAllFeatureFlagsForRequest(req, {
    projectId: typeof req.query.projectId === "string" ? req.query.projectId : undefined,
    subscriptionId: typeof req.query.subscriptionId === "string" ? req.query.subscriptionId : undefined,
  });
  res.json({ flags });
});

router.get("/feature-flags/state", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  if (role !== "admin" && role !== "pm") {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }
  res.json(serializeFeatureFlagsState(await loadFeatureFlagsState()));
});

router.put("/feature-flags/global/:key", requireAuth(), async (req, res) => {
  if ((await getRoleAsync(req)) !== "admin") {
    res.status(403).json({ error: "Accès refusé — activation globale réservée à l'admin" });
    return;
  }
  const key = String(req.params.key);
  if (!featureDef(key)) {
    res.status(404).json({ error: "Fonctionnalité inconnue" });
    return;
  }
  const parsed = SetGlobalFeatureFlagBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Données invalides", details: parsed.error.issues });
    return;
  }
  const { enabled } = parsed.data;
  if (enabled === null || enabled === undefined) {
    await db.delete(featureFlagGlobalsTable).where(eq(featureFlagGlobalsTable.featureKey, key));
  } else {
    await db
      .insert(featureFlagGlobalsTable)
      .values({ featureKey: key, enabled, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: featureFlagGlobalsTable.featureKey,
        set: { enabled, updatedAt: new Date() },
      });
  }
  res.json(serializeFeatureFlagsState(await loadFeatureFlagsState()));
});

router.put("/feature-flags/delegations/:key", requireAuth(), async (req, res) => {
  if ((await getRoleAsync(req)) !== "admin") {
    res.status(403).json({ error: "Accès refusé — délégation réservée à l'admin" });
    return;
  }
  const key = String(req.params.key);
  const def = featureDef(key);
  if (!def) {
    res.status(404).json({ error: "Fonctionnalité inconnue" });
    return;
  }
  const parsed = SetFeatureFlagDelegationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Données invalides", details: parsed.error.issues });
    return;
  }
  if (parsed.data.delegated) {
    if (!def.pmDelegable) {
      res.status(400).json({ error: "Cette fonctionnalité n'est pas délégable au PM" });
      return;
    }
    await db
      .insert(featureFlagDelegationsTable)
      .values({ featureKey: key })
      .onConflictDoNothing();
  } else {
    await db.delete(featureFlagDelegationsTable).where(eq(featureFlagDelegationsTable.featureKey, key));
  }
  res.json(serializeFeatureFlagsState(await loadFeatureFlagsState()));
});

/** Le PM ne peut agir que sur une clé délégable ET déléguée par l'admin. */
async function pmAllowed(key: string): Promise<boolean> {
  const def = featureDef(key);
  if (!def?.pmDelegable) return false;
  const [row] = await db
    .select()
    .from(featureFlagDelegationsTable)
    .where(eq(featureFlagDelegationsTable.featureKey, key));
  return Boolean(row);
}

router.post("/feature-flags/overrides", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  if (role !== "admin" && role !== "pm") {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }
  const parsed = CreateFeatureFlagOverrideBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Données invalides", details: parsed.error.issues });
    return;
  }
  const data = parsed.data;
  if (!featureDef(data.featureKey)) {
    res.status(404).json({ error: "Fonctionnalité inconnue" });
    return;
  }
  if (role === "pm" && !(await pmAllowed(data.featureKey))) {
    res.status(403).json({ error: "Accès refusé — clé non déléguée par l'admin" });
    return;
  }
  const [override] = await db
    .insert(featureFlagOverridesTable)
    .values({
      featureKey: data.featureKey,
      scope: data.scope,
      target: data.target ?? "",
      enabled: data.enabled,
      createdBy: role,
    })
    .returning();
  res.status(201).json({
    id: override.id,
    featureKey: override.featureKey,
    scope: override.scope,
    target: override.target,
    enabled: override.enabled,
    createdBy: override.createdBy,
  });
});

router.delete("/feature-flags/overrides/:id", requireAuth(), async (req, res) => {
  const role = await getRoleAsync(req);
  if (role !== "admin" && role !== "pm") {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }
  const [existing] = await db
    .select()
    .from(featureFlagOverridesTable)
    .where(eq(featureFlagOverridesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Override introuvable" });
    return;
  }
  if (role === "pm" && !(await pmAllowed(existing.featureKey))) {
    res.status(403).json({ error: "Accès refusé — clé non déléguée par l'admin" });
    return;
  }
  await db.delete(featureFlagOverridesTable).where(eq(featureFlagOverridesTable.id, id));
  res.status(204).send();
});

export default router;
