import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useAuth, useUser } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export type AppRole = "client" | "pm" | "partner" | "admin";

export function normalizeAppRole(role: unknown): AppRole | null {
  if (role === "admin" || role === "client" || role === "pm" || role === "partner") {
    return role;
  }
  if (role === "project_manager") return "pm";
  if (role === "agency") return "partner";
  return null;
}

interface RoleContextValue {
  role: AppRole;
  isLoading: boolean;
  isError: boolean;
  refreshRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextValue>({
  role: "client",
  isLoading: false,
  isError: false,
  refreshRole: async () => {},
});

async function fetchServerRole(
  getToken: () => Promise<string | null>,
  signal: AbortSignal,
): Promise<AppRole> {
  const token = await getToken();
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "same-origin",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    signal,
  });

  if (!response.ok) {
    throw new Error(`Impossible de vérifier le rôle (HTTP ${response.status})`);
  }

  const payload = (await response.json()) as { role?: unknown };
  const role = normalizeAppRole(payload.role);
  if (!role) throw new Error("Le serveur a retourné un rôle inconnu");
  return role;
}

/**
 * Le serveur est la source d'autorité des rôles. Il peut relire les
 * publicMetadata Clerk même lorsqu'elles ne sont pas encore présentes dans
 * le jeton de session du navigateur.
 */
export function RoleProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const { user } = useUser();
  const tokenGetterRef = useRef(getToken);
  tokenGetterRef.current = getToken;

  const clerkRole = normalizeAppRole(user?.publicMetadata?.role);

  useEffect(() => {
    if (!isSignedIn || !userId) {
      setAuthTokenGetter(null);
      return;
    }

    setAuthTokenGetter(() => tokenGetterRef.current());
    return () => setAuthTokenGetter(null);
  }, [isSignedIn, userId]);

  const roleQuery = useQuery({
    queryKey: ["auth-role", userId],
    queryFn: ({ signal }) => fetchServerRole(getToken, signal),
    enabled: Boolean(isLoaded && isSignedIn && userId),
    retry: 1,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const role = roleQuery.data ?? clerkRole ?? "client";
  const roleIsRequired = Boolean(isSignedIn && !clerkRole);
  const isLoading = !isLoaded || (roleIsRequired && roleQuery.isPending);
  const isError = roleIsRequired && roleQuery.isError;

  const refreshRole = useCallback(async () => {
    await roleQuery.refetch();
  }, [roleQuery.refetch]);

  return (
    <RoleContext.Provider value={{ role, isLoading, isError, refreshRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useAppRole() {
  return useContext(RoleContext);
}
