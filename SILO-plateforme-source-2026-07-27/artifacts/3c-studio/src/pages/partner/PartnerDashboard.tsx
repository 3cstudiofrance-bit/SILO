import { PartnerLayout } from "./PartnerLayout";
import { useUser } from "@clerk/react";
import { Link } from "wouter";
import { Briefcase, CheckCircle, Euro, Star, ArrowRight, Clock, Loader2 } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { useListPartnerMissions } from "@workspace/api-client-react";

const MISSION_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  en_attente: { label: "En attente", color: "bg-yellow-500/10 text-yellow-400" },
  acceptee: { label: "Acceptée", color: "bg-blue-500/10 text-blue-400" },
  en_cours: { label: "En cours", color: "bg-violet-500/10 text-violet-400" },
  livree: { label: "Livrée", color: "bg-cyan-500/10 text-cyan-400" },
  validee: { label: "Validée", color: "bg-emerald-500/10 text-emerald-400" },
  refusee: { label: "Refusée", color: "bg-red-500/10 text-red-400" },
};

export default function PartnerDashboard() {
  const { user } = useUser();
  const firstName = user?.firstName || "Partenaire";

  const { data: missions = [], isLoading } = useListPartnerMissions();

  const activeMissions = missions.filter(m => ["acceptee", "en_cours"].includes(m.status ?? ""));
  const completedMissions = missions.filter(m => ["valide"].includes(m.status ?? ""));
  const revenusTotal = missions
    .filter(m => m.status === "valide")
    .reduce((sum, m) => sum + (m.amount ?? 0), 0);

  if (isLoading) {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bonjour, {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Vos missions et performances en un coup d'œil.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Missions en cours"   value={activeMissions.length}    icon={Briefcase}   description="Actuellement actives" />
          <StatCard label="Missions terminées"  value={completedMissions.length} icon={CheckCircle} description="Validées" />
          <StatCard label="Revenus validés"     value={revenusTotal > 0 ? `${(revenusTotal / 1000).toFixed(1)}k €` : "—"} icon={Euro} description="Rémunérations perçues" />
          <StatCard label="Total missions"      value={missions.length}          icon={Star}        description="Depuis votre arrivée" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Missions en cours */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Missions en cours</h2>
                </div>
                <Link href="/partner/missions">
                  <button className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">Toutes mes missions <ArrowRight className="w-3 h-3" /></button>
                </Link>
              </div>

              {activeMissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-border text-center">
                  <Briefcase className="w-7 h-7 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune mission en cours</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Votre chef de projet vous assignera des missions prochainement.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="divide-y divide-border">
                    {activeMissions.map(m => (
                      <div key={m.id} className="flex items-center gap-4 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                          {m.dueDate && (
                            <p className="text-xs text-muted-foreground">
                              Échéance : {new Date(m.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                            </p>
                          )}
                        </div>
                        {m.status && (
                          <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${MISSION_STATUS_LABEL[m.status]?.color ?? "bg-secondary text-secondary-foreground"}`}>
                            {MISSION_STATUS_LABEL[m.status]?.label ?? m.status}
                          </span>
                        )}
                        {m.amount && (
                          <span className="text-sm font-bold shrink-0">{m.amount.toLocaleString("fr-FR")} €</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Historique */}
            {missions.length > activeMissions.length && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Historique missions</h2>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-card/50">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Mission</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Statut</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Rémunération</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missions.filter(m => !["acceptee", "en_cours"].includes(m.status ?? "")).slice(0, 5).map((m, i, arr) => (
                        <tr key={m.id} className={`hover:bg-card/50 transition-colors ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium">{m.title}</p>
                          </td>
                          <td className="px-4 py-3">
                            {m.status && (
                              <span className={`text-xs px-2.5 py-1 rounded-full ${MISSION_STATUS_LABEL[m.status]?.color ?? "bg-secondary text-secondary-foreground"}`}>
                                {MISSION_STATUS_LABEL[m.status]?.label ?? m.status}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold">
                            {m.amount ? `${m.amount.toLocaleString("fr-FR")} €` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>

          {/* Profil */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mon profil</h2>
            <div className="bg-card/50 border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {(user?.firstName?.[0] || "P").toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{user?.fullName || "Mon Studio"}</p>
                  <p className="text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Missions totales</span>
                  <span className="font-semibold">{missions.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">En cours</span>
                  <span className="font-semibold text-violet-400">{activeMissions.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Revenus validés</span>
                  <span className="font-semibold text-emerald-400">{revenusTotal.toLocaleString("fr-FR")} €</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PartnerLayout>
  );
}
