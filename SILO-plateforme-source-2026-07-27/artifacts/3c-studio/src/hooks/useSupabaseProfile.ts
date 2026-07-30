/**
 * useSupabaseProfile — Synchronise le profil Clerk → Supabase au chargement
 */
import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { syncUserProfile, getUserProfile, setOnlineStatus } from "@/services/authService";
import type { UserProfile } from "@/types";

export function useSupabaseProfile() {
  const { user, isLoaded, isSignedIn } = useUser();
  const profileSyncEnabled =
    import.meta.env.VITE_ENABLE_SUPABASE_PROFILE_SYNC === "true";
  const userId = user?.id ?? null;
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const firstName = user?.firstName ?? undefined;
  const lastName = user?.lastName ?? undefined;
  const avatarUrl = user?.imageUrl ?? undefined;
  const role = user?.publicMetadata?.role as UserProfile["role"] | undefined;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!profileSyncEnabled || !isLoaded || !isSignedIn || !userId) {
      setIsSyncing(false);
      return;
    }

    const activeUserId = userId;
    let cancelled = false;

    async function sync() {
      setIsSyncing(true);
      try {
        const existing = await getUserProfile(activeUserId);
        if (cancelled) return;
        if (existing) {
          setProfile(existing);
          return;
        }

        const synced = await syncUserProfile({
          clerkUserId: activeUserId,
          email,
          firstName,
          lastName,
          avatarUrl,
          role: role ?? "client",
        });

        if (!cancelled) setProfile(synced);
      } catch (error) {
        console.error("[profile] Synchronisation impossible", error);
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    }

    void sync();

    // Marquer en ligne
    void setOnlineStatus(activeUserId, true);

    // Marquer hors ligne à la fermeture
    const handleUnload = () => {
      void setOnlineStatus(activeUserId, false);
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      cancelled = true;
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [
    avatarUrl,
    email,
    firstName,
    isLoaded,
    isSignedIn,
    lastName,
    profileSyncEnabled,
    role,
    userId,
  ]);

  return { profile, isSyncing };
}
