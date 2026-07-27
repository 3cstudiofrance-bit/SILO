import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProjectFeed } from "@/components/feed/ProjectFeed";
import { useListProjects } from "@workspace/api-client-react";
import {
  useCommState, useSetGlobalBlock, useSetAdminAuthorization, projectCommOf,
} from "@/lib/comm-settings";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ShieldAlert, Radio, Eye, Loader2, FolderOpen } from "lucide-react";

function Toggle({ checked, onChange, disabled, danger }: {
  checked: boolean; onChange: () => void; disabled?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
        checked ? (danger ? "bg-red-500" : "bg-emerald-500") : "bg-secondary border border-border",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export default function AdminCommunication() {
  const comm = useCommState();
  const globalBlock = useSetGlobalBlock();
  const authorization = useSetAdminAuthorization();
  const { toast } = useToast();
  const { data: projects = [], isLoading } = useListProjects();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const feedProjects = projects.slice(0, 10);
  const effectiveId = selectedId ?? feedProjects[0]?.id ?? null;
  const selected = feedProjects.find(p => p.id === effectiveId) ?? feedProjects[0] ?? null;

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <div className="flex items-center gap-2.5 mb-1">
          <Radio className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Communication & supervision</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Contrôle des canaux Client ↔ Agence et supervision des feeds projet. La communication directe est désactivée par défaut.
        </p>

        {/* Blocage global */}
        <div className={cn("rounded-xl border p-4 mb-6 flex items-center justify-between gap-4",
          comm.blocageGlobal ? "bg-red-500/5 border-red-500/25" : "bg-card border-border")}>
          <div className="flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center",
              comm.blocageGlobal ? "bg-red-500/10 border-red-500/25 text-red-400" : "bg-secondary border-border text-muted-foreground")}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Blocage global Client ↔ Agence</p>
              <p className="text-[11px] text-muted-foreground">
                {comm.blocageGlobal
                  ? "Actif : toute communication directe est coupée, quelles que soient les autorisations projet."
                  : "Inactif. Prime sur toutes les autorisations par projet lorsqu'il est activé."}
              </p>
            </div>
          </div>
          <Toggle
            checked={comm.blocageGlobal}
            danger
            onChange={() => {
              const next = !comm.blocageGlobal;
              globalBlock.mutate(
                { data: { blocked: next } },
                {
                  onSuccess: () =>
                    toast({
                      title: next ? "Blocage global activé" : "Blocage global levé",
                      description: next ? "Tous les canaux directs Client↔Agence sont fermés." : "Les autorisations par projet reprennent effet.",
                    }),
                  onError: () =>
                    toast({ title: "Action refusée", description: "Réservé à l'administration.", variant: "destructive" }),
                },
              );
            }}
          />
        </div>

        {/* Autorisations par projet */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : feedProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border text-center mb-8">
            <FolderOpen className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Aucun projet — les autorisations par projet apparaîtront ici.</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl bg-card border border-border overflow-hidden mb-8">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Autorisations par projet</p>
                <p className="text-[11px] text-muted-foreground">Autoriser le chef de projet à activer la communication directe. Le canal ne s'ouvre que si le PM l'active ensuite.</p>
              </div>
              <div className="divide-y divide-border">
                {feedProjects.map(p => {
                  const pid = String(p.id);
                  const s = projectCommOf(comm.projets, pid);
                  const effective = s.directEnabled && !comm.blocageGlobal;
                  return (
                    <div key={p.id} className="px-4 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{p.title}</p>
                        <p className="text-[10px] text-muted-foreground/70">{p.clientName}</p>
                      </div>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium hidden sm:inline",
                        effective
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                          : "bg-secondary text-muted-foreground border-border")}>
                        {effective ? "Canal direct actif" : s.activeParPm ? "PM : activé (bloqué)" : s.adminAutorisePm ? "Autorisé — PM inactif" : "Fermé (défaut)"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground hidden md:inline">Autoriser le PM</span>
                        <Toggle
                          checked={s.adminAutorisePm}
                          onChange={() => {
                            const next = !s.adminAutorisePm;
                            authorization.mutate(
                              { projectId: pid, data: { authorized: next } },
                              {
                                onSuccess: () =>
                                  toast({
                                    title: next ? "PM autorisé" : "Autorisation retirée",
                                    description: `${p.title} — ${next ? "le chef de projet peut activer la communication directe." : "communication directe refermée."}`,
                                  }),
                                onError: () =>
                                  toast({ title: "Action refusée", description: "Réservé à l'administration.", variant: "destructive" }),
                              },
                            );
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Supervision des feeds */}
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Supervision du feed projet</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">Visibilité totale</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mb-4">
              {feedProjects.map(p => (
                <button key={p.id} onClick={() => setSelectedId(p.id)}
                  className={cn("px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors",
                    effectiveId === p.id
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "bg-card text-muted-foreground border-border hover:text-foreground")}>
                  {p.title}
                </button>
              ))}
            </div>
            {selected && <ProjectFeed projectId={String(selected.id)} projectTitle={selected.title} role="admin" />}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
