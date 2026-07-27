import type { Request } from "express";
import { clerkClient, getAuth } from "@clerk/express";

export type Role = "admin" | "pm" | "partner" | "client";

export function normalizeRole(role: unknown): Role | null {
  if (role === "admin" || role === "pm" || role === "partner" || role === "client") return role;
  if (role === "project_manager") return "pm";
  if (role === "agency") return "partner";
  return null;
}

function sessionClaims(req: Request): any {
  try {
    return getAuth(req)?.sessionClaims ?? null;
  } catch {
    return null;
  }
}

/** Rôle issu des claims Clerk (publicMetadata.role, avec repli sur metadata.role). */
export function getRole(req: Request): Role {
  const claims = sessionClaims(req);
  return normalizeRole(claims?.publicMetadata?.role ?? claims?.metadata?.role) ?? "client";
}

// Le token de session Clerk n'embarque pas toujours publicMetadata (selon la
// config du template de session). Repli : lecture du user via l'API Clerk,
// avec un petit cache mémoire pour éviter un appel par requête.
const roleCache = new Map<string, { role: Role; expires: number }>();
const ROLE_CACHE_TTL_MS = 60_000;

export async function getRoleAsync(req: Request): Promise<Role> {
  const claims = sessionClaims(req);
  const fromClaims = normalizeRole(claims?.publicMetadata?.role ?? claims?.metadata?.role);
  if (fromClaims) return fromClaims;

  const userId = getUserId(req);
  if (!userId) return "client";

  const cached = roleCache.get(userId);
  if (cached && cached.expires > Date.now()) return cached.role;

  try {
    const user = await clerkClient.users.getUser(userId);
    const role = normalizeRole((user.publicMetadata as any)?.role) ?? "client";
    roleCache.set(userId, { role, expires: Date.now() + ROLE_CACHE_TTL_MS });
    return role;
  } catch {
    return "client";
  }
}

export function getUserId(req: Request): string | null {
  try {
    return getAuth(req)?.userId ?? null;
  } catch {
    return null;
  }
}

// Nom d'affichage de l'auteur — jamais fourni par le client.
const nameCache = new Map<string, { name: string | null; expires: number }>();
const NAME_CACHE_TTL_MS = 60_000;

export async function getUserNameAsync(req: Request): Promise<string | null> {
  const userId = getUserId(req);
  if (!userId) return null;
  const cached = nameCache.get(userId);
  if (cached && cached.expires > Date.now()) return cached.name;
  try {
    const user = await clerkClient.users.getUser(userId);
    const name =
      user.fullName ??
      [user.firstName, user.lastName].filter(Boolean).join(" ") ??
      user.primaryEmailAddress?.emailAddress ??
      null;
    const resolved = name && name.length > 0 ? name : null;
    nameCache.set(userId, { name: resolved, expires: Date.now() + NAME_CACHE_TTL_MS });
    return resolved;
  } catch {
    return null;
  }
}

export function getUserEmail(req: Request): string | null {
  const claims = sessionClaims(req);
  return claims?.email ?? claims?.primaryEmail ?? null;
}
