import { DashboardLayout } from "@/components/DashboardLayout";
import { Link } from "wouter";
import {
  FolderOpen, FileText, TrendingUp, Users, Building2,
  ArrowRight, CheckCircle2, Clock, Loader2, Activity
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { useListProjects, useListQuotes, useGetDashboardStats, useGetRecentActivity } from "@workspace/api-client-react";

const TYPE_LABEL: Record<string, string> = {
  mariage: "Mariage", clip: "Clip", corporate: "Corporate",
  reseaux: "Réseaux", evenement: "Événement", pub: "Pub", autre: "Autre",
};
const STATUS_LABEL: Record<string, string> = {
  lead: "Demande", devis: "Devis", production: "Production",
  post_production: "Post-prod", livraison_agence: "Livr. agence",
  verification: "Vérif.", livraison_client: "Livr. client",
  correction: "Correction", validation_finale: "Validé",
  notation: "Notation", archive: "Archivé", termine: "Terminé",
};
const QUOTE_STATUS: Record<string, { label: string; color: string }> = {
  en_attente: { label: "En attente", color: "bg-yellow-500/20 text-yellow-400" },
  envoye: { label: "Envoyé", color: "bg-blue-500/20 text-blue-400" },
  accepte: { label: "Accepté", color: "bg-green-500/20 text-green-400" },
  refuse: { label: "Refusé", color: "bg-red-500/20 text-red-400" },
};
const PIPELINE_STEPS = [
  { key: "lead", label: "Demandes" },
  { key: "devis", label: "Devis" },
  { key: "production", label: "Production" },
  { key: "post_production", label: "Post-prod" },
  { key: "livraison_agence", label: "Livr. agence" },
  { key: "livraison_client", label: "Livr. client" },
  { key: "validation_finale", label: "Validé" },
];
const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  project_created: FolderOpen, project_updated: Activity,
  quote_submitted: FileText, quote_updated: CheckCircle2,
};

export default function AdminDashboard() {
  const { data: projects = [], isLoading: pLoading } = useListProjects();
  const { data: quotes = [], isLoading: qLoading } = useListQuotes();
  const { data: stats, isLoading: sLoading } = useGetDashboardStats();
  const { data: activity = [], isLoading: aLoading } = useGetRecentActivity();
  const isLoading = pLoading || qLoading || sLoading || aLoading;

  const activeProjects = projects.filter(p => !["archive", "termine"].includes(p.status));
  const pendingQuotes = quotes.filter(q => q.status === "en_attente").slice(0, 5);
  const pipeline = PIPELINE_STEPS.map(s => ({
    ...s,
    count: projects.filter(p => p.status === s.key).length,
  })).filter(s => s.count > 0);
  const maxCount = Math.max(1, ...pipeline.map(s => s.count));

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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Vue d'ensemble</h1>
            <p className="text-sm text-muted-foreground mt-1">Administration Silo — tableau de bord global.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/projets">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-medium hover:bg-card/80 transition-colors">
                <FolderOpen className="w-4 h-4" /> Projets
              </button>
            </Link>
            <Link href="/admin/devis">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                <FileText className="w-4 h-4" /> Devis
              </button>
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Projets actifs"    value={stats?.activeProjects ?? activeProjects.length}              icon={FolderOpen}   description="En production ou livraison" />
          <StatCard label="CA total"          value={stats ? `${(stats.revenueTotal / 1000).toFixed(1)}k €` : "—"} icon={TrendingUp}   description="Ensemble des projets" />
          <StatCard label="Devis en attente"  value={stats?.pendingQuotes ?? quotes.filter(q => q.status === "en_attente").length} icon={FileText}    description="À valider" />
          <StatCard label="Projets livrés"    value={stats?.deliveredProjects ?? 0}                                icon={CheckCircle2} description="Terminés et validés" />
        </div>

        {/* Pipeline */}
        {pipeline.length > 0 && (
          <div className="bg-card/50 border border-border rounded-2xl p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">Pipeline projets</h2>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${pipeline.length}, 1fr)` }}>
              {pipeline.map(step => (
                <div key={step.key} className="flex flex-col items-center gap-2">
                  <div className="w-full bg-card rounded-lg overflow-hidden" style={{ height: 80 }}>
                    <div
                      className="w-full bg-primary/30 rounded-lg transition-all"
                      style={{ height: `${(step.count / maxCount) * 100}%`, marginTop: `${100 - (step.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-semibold text-center text-muted-foreground">{step.label}</p>
                  <span className="text-sm font-bold">{step.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Projets récents */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projets actifs</h2>
                <Link href="/admin/projets">
                  <button className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">Voir tout <ArrowRight className="w-3 h-3" /></button>
                </Link>
              </div>
              {activeProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-border text-center">
                  <FolderOpen className="w-7 h-7 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun projet actif</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-card/50">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Projet / Client</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Type</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Statut</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Budget</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeProjects.slice(0, 6).map((p, i) => (
                        <tr key={p.id} className={`hover:bg-card/50 transition-colors cursor-pointer ${i < Math.min(activeProjects.length, 6) - 1 ? "border-b border-border" : ""}`}>
                          <td className="px-4 py-3">
                            <Link href={`/admin/projets/${p.id}`}>
                              <p className="text-sm font-medium hover:text-primary transition-colors">{p.title}</p>
                            </Link>
                            <p className="text-xs text-muted-foreground">{p.clientName}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">{TYPE_LABEL[p.type] ?? p.type}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">{STATUS_LABEL[p.status] ?? p.status}</span>
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

            {/* Devis en attente */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Devis en attente</h2>
                <Link href="/admin/devis">
                  <button className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">Voir tout <ArrowRight className="w-3 h-3" /></button>
                </Link>
              </div>
              {pendingQuotes.length === 0 ? (
                <div className="flex items-center justify-center py-6 rounded-xl border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">Aucun devis en attente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingQuotes.map(q => {
                    const s = QUOTE_STATUS[q.status] ?? { label: q.status, color: "bg-secondary text-secondary-foreground" };
                    return (
                      <div key={q.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-card/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{q.clientName}</p>
                          <p className="text-xs text-muted-foreground truncate">{q.serviceType} {q.details ? `· ${q.details.slice(0, 40)}` : ""}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${s.color}`}>{s.label}</span>
                        {q.amount && <span className="text-sm font-bold shrink-0">{q.amount.toLocaleString("fr-FR")} €</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Activité récente */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activité récente</h2>
            </div>
            {activity.length === 0 ? (
              <div className="flex items-center justify-center py-10 rounded-xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground">Aucune activité</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activity.slice(0, 8).map(a => {
                  const IconComponent = ACTIVITY_ICONS[a.type] ?? Activity;
                  return (
                    <div key={a.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <IconComponent className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium leading-tight">{a.title}</p>
                        {a.description && <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{a.description}</p>}
                        <p className="text-[10px] text-muted-foreground/50 mt-1">
                          {new Date(a.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Accès rapide */}
            <div className="pt-4 border-t border-border space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accès rapide</h3>
              {[
                { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
                { href: "/admin/agences", label: "Agences", icon: Building2 },
                { href: "/admin/finance", label: "Finance & FRP", icon: TrendingUp },
                { href: "/admin/stats", label: "Statistiques", icon: Activity },
              ].map(item => (
                <Link key={item.href} href={item.href}>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-card transition-colors cursor-pointer group">
                    <item.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
                    <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
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
