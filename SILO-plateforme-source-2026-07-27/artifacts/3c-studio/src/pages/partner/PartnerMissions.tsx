import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PartnerLayout } from "./PartnerLayout";
import { Search, Briefcase, Loader2, Play, CheckCircle2, X } from "lucide-react";
import {
  getListPartnerMissionsQueryKey,
  useListPartnerMissions,
  useUpdatePartnerMission,
  type PartnerMission,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const STATUS_PILLS = [
  { key: "all",       label: "Toutes" },
  { key: "en_attente", label: "En attente" },
  { key: "accepte",  label: "Acceptées" },
  { key: "en_cours",  label: "En cours" },
  { key: "livre",    label: "Livrées" },
  { key: "valide",   label: "Validées" },
];
const MISSION_STATUS: Record<string, { label: string; color: string }> = {
  en_attente: { label: "En attente", color: "bg-yellow-500/10 text-yellow-400" },
  accepte: { label: "Acceptée", color: "bg-blue-500/10 text-blue-400" },
  en_cours: { label: "En cours", color: "bg-violet-500/10 text-violet-400" },
  livre: { label: "Livrée", color: "bg-cyan-500/10 text-cyan-400" },
  valide: { label: "Validée", color: "bg-emerald-500/10 text-emerald-400" },
  refuse: { label: "Refusée", color: "bg-red-500/10 text-red-400" },
};

export default function PartnerMissions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: missions = [], isLoading } = useListPartnerMissions();
  const updateMission = useUpdatePartnerMission();

  const setMissionStatus = (
    mission: PartnerMission,
    status: "accepte" | "en_cours" | "livre" | "refuse",
  ) => {
    updateMission.mutate(
      { id: mission.id, data: { status } },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: getListPartnerMissionsQueryKey(),
          });
          toast({ title: "Mission mise à jour" });
        },
        onError: (error) => {
          toast({
            title: "Mise à jour refusée",
            description: error instanceof Error ? error.message : undefined,
            variant: "destructive",
          });
        },
      },
    );
  };

  const filtered = missions.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !search || m.title.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <PartnerLayout>
      <div className="space-y-6">

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes missions</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} mission{filtered.length > 1 ? "s" : ""} — {missions.length} au total</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une mission…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_PILLS.map(s => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                statusFilter === s.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
              {s.key !== "all" && (
                <span className="ml-1.5 opacity-60">{missions.filter(m => m.status === s.key).length}</span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-border">
            <Briefcase className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {search || statusFilter !== "all" ? "Aucun résultat" : "Aucune mission assignée"}
            </p>
            {(search || statusFilter !== "all") && (
              <button onClick={() => { setSearch(""); setStatusFilter("all"); }} className="mt-2 text-xs text-primary hover:underline">
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Mission</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Échéance</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Rémunération</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => {
                  const s = m.status ? (MISSION_STATUS[m.status] ?? { label: m.status, color: "bg-secondary text-secondary-foreground" }) : null;
                  return (
                    <tr key={m.id} className={`hover:bg-card/50 transition-colors ${i < filtered.length - 1 ? "border-b border-border" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{m.title}</p>
                        {m.brief && <p className="text-xs text-muted-foreground line-clamp-1">{m.brief}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {s && <span className={`text-xs px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                        {m.dueDate ? new Date(m.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold">
                        {m.amount ? `${m.amount.toLocaleString("fr-FR")} €` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <MissionActions
                          mission={m}
                          pending={
                            updateMission.isPending &&
                            updateMission.variables?.id === m.id
                          }
                          onStatus={(status) => setMissionStatus(m, status)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PartnerLayout>
  );
}

function MissionActions({
  mission,
  pending,
  onStatus,
}: {
  mission: PartnerMission;
  pending: boolean;
  onStatus: (
    status: "accepte" | "en_cours" | "livre" | "refuse",
  ) => void;
}) {
  if (pending) {
    return (
      <div className="flex justify-end">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (mission.status === "en_attente") {
    return (
      <div className="flex justify-end gap-1.5">
        <button
          type="button"
          onClick={() => onStatus("refuse")}
          className="inline-flex items-center gap-1 border border-red-400/30 px-2 py-1 text-xs text-red-400"
        >
          <X className="h-3 w-3" /> Refuser
        </button>
        <button
          type="button"
          onClick={() => onStatus("accepte")}
          className="inline-flex items-center gap-1 bg-primary px-2 py-1 text-xs text-primary-foreground"
        >
          <CheckCircle2 className="h-3 w-3" /> Accepter
        </button>
      </div>
    );
  }
  if (mission.status === "accepte") {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onStatus("en_cours")}
          className="inline-flex items-center gap-1 bg-primary px-2 py-1 text-xs text-primary-foreground"
        >
          <Play className="h-3 w-3" /> Démarrer
        </button>
      </div>
    );
  }
  if (mission.status === "en_cours") {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onStatus("livre")}
          className="inline-flex items-center gap-1 bg-primary px-2 py-1 text-xs text-primary-foreground"
        >
          <CheckCircle2 className="h-3 w-3" /> Marquer livrée
        </button>
      </div>
    );
  }

  return (
    <p className="text-right text-xs text-muted-foreground">
      {mission.status === "livre" ? "Validation SILO" : "—"}
    </p>
  );
}
