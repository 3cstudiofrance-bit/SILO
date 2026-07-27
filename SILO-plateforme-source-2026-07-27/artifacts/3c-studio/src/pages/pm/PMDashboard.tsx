import { DashboardLayout } from "@/components/DashboardLayout";
import { Link } from "wouter";
import { FolderOpen, Truck, AlertTriangle, ArrowRight, CheckCircle2, Loader2, Inbox } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { useListProjects } from "@workspace/api-client-react";
import {
  ADVISOR_MAX_ACTIVE_PROJECTS,
  ADVISOR_WARNING_ACTIVE_PROJECTS,
} from "@/lib/finance";

const STATUS_LABEL: Record<string, string> = {
  lead: "Nouvelle demande",
  devis: "Devis",
  production: "Production",
  post_production: "Post-production",
  livraison_agence: "Livraison agence",
  verification: "Vérification",
  livraison_client: "Livraison client",
  correction: "Correction",
  validation_finale: "Validé",
  notation: "Notation",
  archive: "Archivé",
  termine: "Terminé",
};

const TYPE_LABEL: Record<string, string> = {
  mariage: "Mariage",
  clip: "Clip",
  corporate: "Corporate",
  reseaux: "Réseaux",
  evenement: "Événement",
  pub: "Pub",
  autre: "Autre",
};

export default function PMDashboard() {
  const { data: projects = [], isLoading } = useListProjects();

  const activeProjects = projects.filter(
    (p) => !["archive", "termine", "annule"].includes(p.status),
  );
  const newRequests = projects.filter(p => p.status === "lead");
  const upcomingDeliveries = projects.filter(p => ["livraison_agence", "livraison_client", "verification"].includes(p.status));
  const inProduction = projects.filter(p => ["production", "post_production"].includes(p.status));

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
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chef de projet</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion de la production et coordination des agences.</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Projets actifs"        value={activeProjects.length}       icon={FolderOpen}    description={`${activeProjects.length}/${ADVISOR_MAX_ACTIVE_PROJECTS} dossiers`} />
          <StatCard label="Nouvelles demandes"    value={newRequests.length}          icon={Inbox}         description="À traiter" />
          <StatCard label="En production"         value={inProduction.length}         icon={CheckCircle2}  description="Films en cours" />
          <StatCard label="Livraisons proches"    value={upcomingDeliveries.length}   icon={Truck}         description="À livrer" accent={upcomingDeliveries.length > 0 ? "text-amber-400" : undefined} />
        </div>

        {activeProjects.length >= ADVISOR_WARNING_ACTIVE_PROJECTS && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">
                {activeProjects.length >= ADVISOR_MAX_ACTIVE_PROJECTS
                  ? "Capacité conseiller atteinte"
                  : "Seuil d’anticipation atteint"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeProjects.length}/{ADVISOR_MAX_ACTIVE_PROJECTS} dossiers actifs. Toute nouvelle affectation est bloquée à la capacité maximale.
              </p>
            </div>
          </div>
        )}

        {/* Alerte nouvelles demandes */}
        {newRequests.length > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-400/5 border border-amber-400/20">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-400">
                {newRequests.length} nouvelle{newRequests.length > 1 ? "s" : ""} demande{newRequests.length > 1 ? "s" : ""} à traiter
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Ces projets sont au statut « Demande » et attendent d'être qualifiés.</p>
            </div>
            <Link href="/pm/dossiers">
              <button className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap">Traiter →</button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Projets actifs */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projets en cours</h2>
                <Link href="/pm/commandes">
                  <button className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">Voir tout <ArrowRight className="w-3 h-3" /></button>
                </Link>
              </div>
              {activeProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-border text-center">
                  <FolderOpen className="w-8 h-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Aucun projet actif pour l'instant</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-card/50">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Projet</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Type</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Statut</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Budget</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeProjects.slice(0, 8).map((p, i) => (
                        <tr key={p.id} className={`hover:bg-card/50 transition-colors ${i < Math.min(activeProjects.length, 8) - 1 ? "border-b border-border" : ""}`}>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium">{p.title}</p>
                            <p className="text-xs text-muted-foreground">{p.clientName}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">{TYPE_LABEL[p.type] ?? p.type}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                              {STATUS_LABEL[p.status] ?? p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold">
                            {p.amount ? `${p.amount.toLocaleString("fr-FR")} €` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Livraisons proches */}
            {upcomingDeliveries.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5" /> Livraisons en cours
                </h2>
                <div className="space-y-2">
                  {upcomingDeliveries.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-card/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.clientName}</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 shrink-0">
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                      {p.deliveryDate && (
                        <p className="text-xs text-muted-foreground shrink-0">
                          {new Date(p.deliveryDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Raccourcis */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions rapides</h2>
            <div className="space-y-2">
              {[
                { href: "/pm/dossiers", label: "Centre de traitement", badge: newRequests.length },
                { href: "/pm/attribution", label: "Attribution agence" },
                { href: "/pm/planning", label: "Planning" },
                { href: "/pm/livrables", label: "Livraisons" },
                { href: "/pm/messages/client", label: "Discussion client" },
                { href: "/pm/messages/agence", label: "Discussion agence" },
              ].map(item => (
                <Link key={item.href} href={item.href}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors cursor-pointer">
                    <span className="text-sm font-medium text-muted-foreground hover:text-foreground flex-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-black text-[10px] font-bold flex items-center justify-center shrink-0">
                        {item.badge}
                      </span>
                    )}
                    <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
