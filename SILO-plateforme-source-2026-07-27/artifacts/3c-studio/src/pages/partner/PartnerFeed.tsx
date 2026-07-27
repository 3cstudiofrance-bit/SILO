import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProjectFeed } from "@/components/feed/ProjectFeed";
import { useListPartnerMissions } from "@workspace/api-client-react";
import { useProjectCommStatus } from "@/lib/comm-settings";
import { cn } from "@/lib/utils";
import { Rss, Info, Loader2, Briefcase } from "lucide-react";

function CommInfo({ projectId }: { projectId: string }) {
  const { directEnabled } = useProjectCommStatus(projectId);
  return (
    <div className="mt-4 rounded-xl bg-secondary border border-border p-3">
      <p className="text-[11px] text-muted-foreground/80 leading-relaxed flex gap-2">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        {directEnabled
          ? "La communication directe avec le client est activée sur cette mission (canal supervisé par Silo)."
          : "Le contact direct avec les clients n'est pas autorisé. Vos échanges passent par votre chef de projet Silo."}
      </p>
    </div>
  );
}

export default function PartnerFeed() {
  const { data: missions = [], isLoading } = useListPartnerMissions();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const activeMissions = missions.filter(m => ["acceptee", "en_cours", "livree"].includes(m.status ?? ""));
  const effectiveId = selectedId ?? activeMissions[0]?.projectId ?? null;
  const selected = activeMissions.find(m => m.projectId === effectiveId) ?? activeMissions[0] ?? null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <div className="flex items-center gap-2.5 mb-1">
          <Rss className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Feed mission</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Activité de vos missions : échanges avec votre chef de projet Silo, fichiers et escalades.
        </p>

        {activeMissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border text-center">
            <Briefcase className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Aucune mission active</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-64 flex-shrink-0">
              <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2 px-1">Missions</p>
              <div className="space-y-1">
                {activeMissions.map(m => (
                  <button key={m.id} onClick={() => setSelectedId(m.projectId ?? m.id)}
                    className={cn("w-full text-left px-3 py-2.5 rounded-lg border text-xs transition-colors",
                      effectiveId === (m.projectId ?? m.id)
                        ? "bg-primary/10 border-primary/30 text-foreground"
                        : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary")}>
                    <span className="font-medium block truncate">{m.title}</span>
                    {m.dueDate && <span className="text-[10px] text-muted-foreground/70">Éch. {new Date(m.dueDate).toLocaleDateString("fr-FR")}</span>}
                  </button>
                ))}
              </div>
              {selected?.projectId != null && <CommInfo projectId={String(selected.projectId)} />}
            </div>

            <div className="flex-1 min-w-0">
              {selected?.projectId != null && (
                <ProjectFeed projectId={String(selected.projectId)} projectTitle={selected.title} role="agency" />
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
