import { getAuth } from "@clerk/express";
import type { Request } from "express";

type RoleClaims = {
  metadata?: { role?: string };
  publicMetadata?: { role?: string };
};

export function getAuthInfo(req: Request): {
  userId: string | null;
  role: string | undefined;
  isAdmin: boolean;
  isPM: boolean;
  isPartner: boolean;
} {
  const auth = getAuth(req);
  const claims = auth.sessionClaims as RoleClaims | null | undefined;
  const role = claims?.metadata?.role ?? claims?.publicMetadata?.role;
  return {
    userId: auth.userId,
    role,
    isAdmin: role === "admin",
    isPM: role === "pm" || role === "project_manager",
    isPartner: role === "partner" || role === "agency",
  };
}
