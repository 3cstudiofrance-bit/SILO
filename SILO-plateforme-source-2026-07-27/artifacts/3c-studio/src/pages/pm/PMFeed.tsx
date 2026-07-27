import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProjectFeed } from "@/components/feed/ProjectFeed";
import { useListProjects } from "@workspace/api-client-react";
import { useProjectCommStatus, useSetPmActivation } from "@/lib/comm-settings";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Rss, ShieldOff, Lock, Users, Loader2, FolderOpen } from "lucide-react";

function CommToggleCard({ projectId }: { projectId: string }) {
  const { settings, blocageGlobal, directEnabled } = useProjectCommStatus(projectId);
  const { toast } = useToast();
  const activation = useSetPmActivation();
  const canToggle = settings.adminAutorisePm && !blocageGlobal;

  const handleToggle = () => {
    if (!canToggle) {
      toast({
        title: "Action non autorisée",
        description: blocageGlobal
          ? "Blocage global activé par l'administration."
          : "L'administration doit d'abord vous autoriser à activer la communication directe sur ce projet.",
        variant: "destructive",
      });
      return;
    }
    const next = !settings.activeParPm;
    activation.mutate(
      { projectId, data: { active: next } },
      {
        onSuccess: () => {
          toast({
            title: next ? "Communication directe activée" : "Communication directe désactivée",
            description: next
              ? "Le client et l'agence peuvent échanger sur un canal supervisé."
              : "Les échanges repassent exclusivement par vous.",
          });
        },
        onError: () => {
          toast({
            title: "Action refusée par le serveur",
            description: "Autorisation admin requise ou blocage global en vigueur.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="rounded-xl bg-card border border-border p-4 mb-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0",
            directEnabled ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "bg-secondary border-border text-muted-foreground")}>
            {blocageGlobal ? <ShieldOff className="w-4 h-4 text-red-400" /> : directEnabled ? <Users className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Communication directe Client ↔ Agence</p>
            <p className="text-[11px] text-muted-foreground">
              {blocageGlobal
                ? "Blocage global administrateur en vigueur — canal fermé."
                : directEnabled
                  ? "Canal supervisé actif : vous gardez la visibilité sur tous les échanges."
                  : settings.adminAutorisePm
                    ? "Désactivée. Vous êtes autorisé à l'activer sur ce projet."
                    : "Désactivée par défaut. Autorisation de l'administration requise pour l'activer."}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          role="switch"
          aria-checked={settings.activeParPm && canToggle}
          aria-disabled={!canToggle}
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
            settings.activeParPm && canToggle ? "bg-emerald-500" : "bg-secondary border border-border",
            !canToggle && "opacity-40 cursor-not-allowed"
          )}
        >
          <span className={cn(
            "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all",
            settings.activeParPm && canToggle ? "left-[22px]" : "left-0.5"
          )} />
        </button>
      </div>
    </div>
  );
}

export default function PMFeed() {
  const { data: projects = [], isLoading } = useListProjects();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const feedProjects = projects.slice(0, 10);
  const effectiveId = selectedId ?? feedProjects[0]?.id ?? null;
  const selected = feedProjects.find(p => p.id === effectiveId) ?? feedProjects[0] ?? null;

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
          <h1 className="text-2xl font-bold tracking-tight">Feed projet</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Toute l'activité du dossier — messages, fichiers, notes, escalades — au même endroit.
        </p>

        {feedProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border text-center">
            <FolderOpen className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Aucun projet assigné</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-64 flex-shrink-0">
              <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2 px-1">Projets</p>
              <div className="space-y-1">
                {feedProjects.map(p => (
                  <button key={p.id} onClick={() => setSelectedId(p.id)}
                    className={cn("w-full text-left px-3 py-2.5 rounded-lg border text-xs transition-colors",
                      effectiveId === p.id
                        ? "bg-primary/10 border-primary/30 text-foreground"
                        : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary")}>
                    <span className="font-medium block truncate">{p.title}</span>
                    <span className="text-[10px] text-muted-foreground/70">{p.clientName}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {selected && (
                <>
                  <CommToggleCard projectId={String(selected.id)} />
                  <ProjectFeed projectId={String(selected.id)} projectTitle={selected.title} role="pm" />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
