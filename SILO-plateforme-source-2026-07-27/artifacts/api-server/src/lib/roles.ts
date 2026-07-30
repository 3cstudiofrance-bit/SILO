import type { Request } from "express";
import { clerkClient, getAuth } from "@clerk/express";

export type Role = "admin" | "pm" | "partner" | "client";

type ClerkUserLike = {
  publicMetadata?: unknown;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  emailAddresses?: ReadonlyArray<{ emailAddress?: string | null }>;
};

function configuredAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isConfiguredAdminEmail(email: unknown): boolean {
  return (
    typeof email === "string" &&
    configuredAdminEmails().has(email.trim().toLowerCase())
  );
}

export function getClerkUserEmail(user: ClerkUserLike): string | null {
  return (
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses?.[0]?.emailAddress ??
    null
  );
}

export function roleFromClerkUser(user: ClerkUserLike): Role {
  if (isConfiguredAdminEmail(getClerkUserEmail(user))) return "admin";

  const metadata =
    user.publicMetadata && typeof user.publicMetadata === "object"
      ? (user.publicMetadata as Record<string, unknown>)
      : {};
  return normalizeRole(metadata.role) ?? "client";
}

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
  const claimEmail = claims?.email ?? claims?.primaryEmail;
  if (isConfiguredAdminEmail(claimEmail)) return "admin";

  const fromClaims = normalizeRole(claims?.publicMetadata?.role ?? claims?.metadata?.role);
  // Les rôles internes explicites peuvent être utilisés directement. Pour un
  // rôle client (ou absent), l'API Clerk reste consultée afin que la liste
  // ADMIN_EMAILS puisse promouvoir un compte sans dépendre des metadata Clerk.
  if (fromClaims && fromClaims !== "client") return fromClaims;

  const userId = getUserId(req);
  if (!userId) return "client";

  const cached = roleCache.get(userId);
  if (cached && cached.expires > Date.now()) return cached.role;

  try {
    const user = await clerkClient.users.getUser(userId);
    const role = roleFromClerkUser(user);
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

const emailCache = new Map<string, { email: string | null; expires: number }>();

export async function getUserEmailAsync(req: Request): Promise<string | null> {
  const fromClaims = getUserEmail(req);
  if (fromClaims) return fromClaims;

  const userId = getUserId(req);
  if (!userId) return null;
  const cached = emailCache.get(userId);
  if (cached && cached.expires > Date.now()) return cached.email;

  try {
    const user = await clerkClient.users.getUser(userId);
    const email = getClerkUserEmail(user);
    emailCache.set(userId, { email, expires: Date.now() + ROLE_CACHE_TTL_MS });
    return email;
  } catch {
    return null;
  }
}
