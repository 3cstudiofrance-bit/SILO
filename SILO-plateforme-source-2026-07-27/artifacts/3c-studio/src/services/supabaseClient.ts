import { createClient } from "@supabase/supabase-js";

const rawUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? "";
const publishableKey =
  (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
  )?.trim() ?? "";
const legacyAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? "";
const supabaseKey = publishableKey || legacyAnonKey;

// Normalise l'URL : ajoute https:// si le protocole est absent, puis valide.
function normalizeUrl(value: string): string | null {
  if (!value) return null;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

const supabaseUrl = normalizeUrl(rawUrl);
const isMock = !supabaseUrl || !supabaseKey;

if (isMock) {
  if (rawUrl && !supabaseUrl) {
    console.warn(
      "[Supabase] VITE_SUPABASE_URL invalide (ex. attendu : https://xxxx.supabase.co) — intégration désactivée.",
    );
  } else {
    console.warn(
      "[Supabase] Variables VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY non définies — intégration désactivée.",
    );
  }
} else if (!publishableKey && legacyAnonKey) {
  console.warn(
    "[Supabase] VITE_SUPABASE_ANON_KEY est une clé historique. Migrer vers VITE_SUPABASE_PUBLISHABLE_KEY avant fin 2026.",
  );
}

// Récupère le jeton de session Clerk pour authentifier les requêtes Supabase.
// L'app s'authentifie avec Clerk (pas Supabase Auth) : Clerk est configuré comme
// fournisseur « Third-Party Auth » dans Supabase, et ce jeton porte le claim
// `sub` (= clerk_user_id) et `role: authenticated` utilisés par les politiques RLS.
export async function getSupabaseAccessToken(): Promise<string | null> {
  try {
    const clerk = (
      window as unknown as {
        Clerk?: { session?: { getToken: () => Promise<string | null> } };
      }
    ).Clerk;
    if (!clerk?.session) return null;
    return await clerk.session.getToken();
  } catch {
    return null;
  }
}

export const supabase = isMock
  ? null
  : createClient(supabaseUrl as string, supabaseKey, {
      accessToken: getSupabaseAccessToken,
      realtime: { params: { eventsPerSecond: 10 } },
    });

export const isSupabaseConfigured = !isMock;
export const supabaseProjectUrl = supabaseUrl;
export const supabasePublishableKey = supabaseKey || null;

// Retourne null si Supabase n'est pas configuré.
export function getSupabase() {
  if (!supabase) {
    throw new Error(
      "[Supabase] Client non initialisé — configurer VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY",
    );
  }
  return supabase;
}
