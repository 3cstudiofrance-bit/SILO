/**
 * useSupabaseProfile — Synchronise le profil Clerk → Supabase au chargement
 */
import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { syncUserProfile, getUserProfile, setOnlineStatus } from "@/services/authService";
import type { UserProfile } from "@/types";

export function useSupabaseProfile() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    async function sync() {
      setIsSyncing(true);
      // Essaie d'abord de récupérer le profil existant
      const existing = await getUserProfile(user!.id);
      if (existing) {
        setProfile(existing);
        setIsSyncing(false);
        return;
      }

      // Crée/met à jour le profil depuis Clerk
      const synced = await syncUserProfile({
        clerkUserId: user!.id,
        email: user!.primaryEmailAddress?.emailAddress ?? "",
        firstName: user!.firstName ?? undefined,
        lastName: user!.lastName ?? undefined,
        avatarUrl: user!.imageUrl ?? undefined,
        role: (user!.publicMetadata?.role as UserProfile["role"]) ?? "client",
      });

      setProfile(synced);
      setIsSyncing(false);
    }

    sync();

    // Marquer en ligne
    setOnlineStatus(user.id, true);

    // Marquer hors ligne à la fermeture
    const handleUnload = () => setOnlineStatus(user!.id, false);
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [isLoaded, isSignedIn, user]);

  return { profile, isSyncing };
}
