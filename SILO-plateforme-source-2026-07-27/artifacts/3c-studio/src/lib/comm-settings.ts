/**
 * comm-settings — contrôle de la communication directe Client ↔ Agence.
 *
 * Règle de sécurité (CDC) : DÉSACTIVÉE PAR DÉFAUT.
 * - Seul l'Admin peut autoriser le PM à l'activer (par projet) ;
 * - Le PM ne peut l'activer que si l'Admin l'y a autorisé ;
 * - L'Admin dispose d'un blocage global prioritaire sur tout le reste.
 *
 * L'état vit côté serveur (API /comm/*) — l'enforcement est fait dans l'API,
 * ce module n'expose que des hooks de lecture/mutation.
 */
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetProjectCommStatus,
  useGetCommState,
  useSetCommGlobalBlock,
  useSetCommAuthorization,
  useSetCommActivation,
  getGetCommStateQueryKey,
  getGetProjectCommStatusQueryKey,
} from "@workspace/api-client-react";

export interface ProjectCommSettings {
  adminAutorisePm: boolean;
  activeParPm: boolean;
}

const DEFAULT_PROJECT: ProjectCommSettings = { adminAutorisePm: false, activeParPm: false };

/** Statut de communication d'un projet, tel que le serveur l'expose pour le rôle courant. */
export function useProjectCommStatus(projectId: string | null) {
  const { data, isLoading } = useGetProjectCommStatus(projectId ?? "", {
    query: {
      enabled: Boolean(projectId),
      queryKey: getGetProjectCommStatusQueryKey(projectId ?? ""),
    },
  });
  return {
    settings: {
      adminAutorisePm: data?.adminAutorisePm ?? false,
      activeParPm: data?.activeParPm ?? false,
    } satisfies ProjectCommSettings,
    blocageGlobal: data?.blocageGlobal ?? false,
    directEnabled: data?.directEnabled ?? false,
    isLoading,
  };
}

/** État complet (admin/PM) : blocage global + réglages par projet. */
export function useCommState() {
  const { data, isLoading } = useGetCommState();
  const projets: Record<string, ProjectCommSettings & { directEnabled: boolean }> = {};
  for (const p of data?.projets ?? []) {
    projets[p.projectId] = {
      adminAutorisePm: p.adminAutorisePm ?? false,
      activeParPm: p.activeParPm ?? false,
      directEnabled: p.directEnabled,
    };
  }
  return { blocageGlobal: data?.blocageGlobal ?? false, projets, isLoading };
}

export function projectCommOf(
  projets: Record<string, ProjectCommSettings & { directEnabled: boolean }>,
  projectId: string,
) {
  return projets[projectId] ?? { ...DEFAULT_PROJECT, directEnabled: false };
}

function useInvalidateComm() {
  const qc = useQueryClient();
  return (projectId?: string) => {
    qc.invalidateQueries({ queryKey: getGetCommStateQueryKey() });
    if (projectId) qc.invalidateQueries({ queryKey: getGetProjectCommStatusQueryKey(projectId) });
    else qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith("/api/comm/") });
  };
}

/** Admin : blocage global (prime sur tout). */
export function useSetGlobalBlock() {
  const invalidate = useInvalidateComm();
  const mutation = useSetCommGlobalBlock({
    mutation: { onSuccess: () => invalidate() },
  });
  return mutation;
}

/** Admin : autorise ou retire l'autorisation du PM sur un projet. */
export function useSetAdminAuthorization() {
  const invalidate = useInvalidateComm();
  return useSetCommAuthorization({
    mutation: { onSuccess: (_data, vars) => invalidate(vars.projectId) },
  });
}

/** PM : active/désactive la communication directe — refusé côté serveur sans autorisation admin. */
export function useSetPmActivation() {
  const invalidate = useInvalidateComm();
  return useSetCommActivation({
    mutation: { onSuccess: (_data, vars) => invalidate(vars.projectId) },
  });
}
