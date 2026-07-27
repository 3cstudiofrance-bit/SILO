/**
 * ProfileContext — expose le profil Supabase (UUID) de l'utilisateur Clerk courant.
 * Monte une seule fois la synchronisation Clerk → Supabase (useSupabaseProfile).
 */
import { createContext, useContext, type ReactNode } from "react";
import { useSupabaseProfile } from "@/hooks/useSupabaseProfile";
import type { UserProfile } from "@/types";

interface ProfileContextValue {
  profile: UserProfile | null;
  isSyncing: boolean;
}

const ProfileContext = createContext<ProfileContextValue>({ profile: null, isSyncing: false });

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { profile, isSyncing } = useSupabaseProfile();
  return (
    <ProfileContext.Provider value={{ profile, isSyncing }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
