import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SecureFileLink } from "@/components/files/SecureFileLink";
import { Download, Film, Loader2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useListProjects,
  useListDeliverables,
  getListDeliverablesQueryKey,
} from "@workspace/api-client-react";
import { useFeature } from "@/lib/feature-flags";

export default function ClientDeliverables() {
  const canDownload = useFeature("telechargement_livrables", {
    role: "client",
  });
  const { data: projects = [], isLoading: projectsLoading } = useListProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );

  const effectiveId = selectedProjectId ?? projects[0]?.id ?? null;
  const { data: deliverables = [], isLoading: delLoading } =
    useListDeliverables(effectiveId ?? 0, {
      query: {
        enabled: effectiveId != null,
        queryKey: getListDeliverablesQueryKey(effectiveId ?? 0),
      },
    });
  const isLoading = projectsLoading || delLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Livrables</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Les rendus finalisés de vos projets, vérifiés par votre chef de
              projet.
            </p>
          </div>
          {projects.length > 1 && (
            <div className="sm:ml-auto">
              <select
                value={effectiveId ?? ""}
                onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                className="px-3 py-1.5 text-xs rounded-lg bg-secondary border border-border focus:outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border text-center">
            <Package className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              Aucun projet actif
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
              Vos livrables apparaîtront ici une fois votre chef de projet les
              aura déposés.
            </p>
          </div>
        ) : deliverables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border text-center">
            <Package className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              Aucun livrable disponible
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
              Vos livrables apparaîtront ici une fois votre chef de projet les
              aura déposés.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            {deliverables.map((d) => {
              const downloadable = canDownload && !!d.url;
              return (
                <div key={d.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-lg bg-violet-400/10 flex items-center justify-center shrink-0">
                    <Film className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {d.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 capitalize">
                      {d.type}
                      {d.size ? ` · ${d.size}` : ""}
                    </p>
                  </div>
                  {downloadable ? (
                    <SecureFileLink
                      reference={d.url}
                      className="shrink-0 rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                      title="Télécharger"
                    >
                      <Download className="h-4 w-4" />
                    </SecureFileLink>
                  ) : (
                    <button
                      disabled
                      className={cn(
                        "p-2 rounded-lg transition-colors shrink-0",
                        "text-muted-foreground/30 cursor-not-allowed",
                      )}
                      title="Téléchargement non activé sur votre compte"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!canDownload && deliverables.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Le téléchargement des livrables n'est pas activé sur votre compte.
            Contactez votre chef de projet.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
