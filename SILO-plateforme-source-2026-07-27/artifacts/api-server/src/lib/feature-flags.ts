import type { Request } from "express";
import {
  db,
  featureFlagDelegationsTable,
  featureFlagGlobalsTable,
  featureFlagOverridesTable,
  type FeatureFlagOverride,
} from "@workspace/db";
import { FEATURES, defaultEnabled } from "./feature-defs";
import { getRoleAsync, getUserEmail, getUserId } from "./roles";

export interface FlagsState {
  global: Record<string, boolean>;
  overrides: FeatureFlagOverride[];
  pmDelegations: string[];
}

export interface FlagContext {
  role?: string;
  userEmail?: string | null;
  userId?: string | null;
  projectId?: string;
  subscriptionId?: string;
}

export async function loadFeatureFlagsState(): Promise<FlagsState> {
  const [globals, overrides, delegations] = await Promise.all([
    db.select().from(featureFlagGlobalsTable),
    db.select().from(featureFlagOverridesTable),
    db.select().from(featureFlagDelegationsTable),
  ]);
  const global: Record<string, boolean> = {};
  for (const item of globals) global[item.featureKey] = item.enabled;
  return {
    global,
    overrides,
    pmDelegations: delegations.map((item) => item.featureKey),
  };
}

export function serializeFeatureFlagsState(state: FlagsState) {
  return {
    global: state.global,
    overrides: state.overrides.map((override) => ({
      id: override.id,
      featureKey: override.featureKey,
      scope: override.scope,
      target: override.target,
      enabled: override.enabled,
      createdBy: override.createdBy,
    })),
    pmDelegations: state.pmDelegations,
  };
}

/** Resolution : user > project > subscription > role > global > default. */
export function isFeatureEnabled(
  state: FlagsState,
  key: string,
  context: FlagContext,
): boolean {
  const matches = state.overrides.filter(
    (override) => override.featureKey === key,
  );
  const pick = (scope: string, target?: string | null) =>
    target
      ? matches.find(
          (override) =>
            override.scope === scope && override.target === target,
        )
      : undefined;

  const byUser =
    pick("user", context.userEmail) ?? pick("user", context.userId);
  if (byUser) return byUser.enabled;
  const byProject = pick("project", context.projectId);
  if (byProject) return byProject.enabled;
  const bySubscription = pick("subscription", context.subscriptionId);
  if (bySubscription) return bySubscription.enabled;
  const byRole = pick("role", context.role);
  if (byRole) return byRole.enabled;
  if (key in state.global) return state.global[key];
  return defaultEnabled(key);
}

export async function resolveFeatureFlagForRequest(
  req: Request,
  key: string,
  overrides: Pick<FlagContext, "projectId" | "subscriptionId"> = {},
): Promise<boolean> {
  const state = await loadFeatureFlagsState();
  return isFeatureEnabled(state, key, {
    role: await getRoleAsync(req),
    userEmail: getUserEmail(req),
    userId: getUserId(req),
    ...overrides,
  });
}

export async function resolveAllFeatureFlagsForRequest(
  req: Request,
  overrides: Pick<FlagContext, "projectId" | "subscriptionId"> = {},
): Promise<Record<string, boolean>> {
  const state = await loadFeatureFlagsState();
  const context: FlagContext = {
    role: await getRoleAsync(req),
    userEmail: getUserEmail(req),
    userId: getUserId(req),
    ...overrides,
  };
  const flags: Record<string, boolean> = {};
  for (const feature of FEATURES) {
    flags[feature.key] = isFeatureEnabled(state, feature.key, context);
  }
  return flags;
}
