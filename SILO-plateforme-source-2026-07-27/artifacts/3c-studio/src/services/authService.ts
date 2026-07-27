/**
 * authService — Synchronisation Clerk ↔ Supabase user_profiles
 * Clerk gère l'auth frontend. Supabase stocke les profils enrichis.
 */
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { UserProfile, UserRole } from "@/types";

export interface SyncProfileInput {
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role?: UserRole;
}

/**
 * Crée ou met à jour le profil Supabase depuis les données Clerk.
 * À appeler au login/signup via un hook Clerk.
 */
export async function syncUserProfile(input: SyncProfileInput): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("[authService] Supabase non configuré — sync ignorée");
    return null;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert({
      clerk_user_id: input.clerkUserId,
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      avatar_url: input.avatarUrl,
      role: input.role ?? "client",
      updated_at: new Date().toISOString(),
    }, { onConflict: "clerk_user_id" })
    .select()
    .single();

  if (error) { console.error("[authService] syncUserProfile:", error); return null; }
  return mapProfile(data);
}

/**
 * Récupère le profil Supabase depuis l'ID Clerk.
 */
export async function getUserProfile(clerkUserId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (error) return null;
  return mapProfile(data);
}

/**
 * Met à jour le rôle d'un utilisateur (admin only).
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase
    .from("user_profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  return !error;
}

/**
 * Met à jour le statut en ligne d'un utilisateur.
 */
export async function setOnlineStatus(clerkUserId: string, isOnline: boolean): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  await supabase
    .from("user_profiles")
    .update({
      is_online: isOnline,
      last_seen_at: new Date().toISOString(),
    })
    .eq("clerk_user_id", clerkUserId);
}

// Mapper DB → type TypeScript
function mapProfile(raw: Record<string, unknown>): UserProfile {
  return {
    id: raw.id as string,
    clerkUserId: raw.clerk_user_id as string,
    email: raw.email as string,
    firstName: raw.first_name as string | undefined,
    lastName: raw.last_name as string | undefined,
    fullName: raw.full_name as string | undefined,
    avatarUrl: raw.avatar_url as string | undefined,
    role: raw.role as UserRole,
    phone: raw.phone as string | undefined,
    timezone: (raw.timezone as string) ?? "Europe/Paris",
    notificationPreferences: (raw.notification_preferences as UserProfile["notificationPreferences"]) ?? { email: true, push: true, inApp: true },
    isOnline: (raw.is_online as boolean) ?? false,
    lastSeenAt: raw.last_seen_at as string | undefined,
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
  };
}
