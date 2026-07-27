import { DashboardLayout } from "@/components/DashboardLayout";
import {
  BarChart3,
  Star,
  Building2,
  Users,
  Loader2,
  FolderOpen,
  FileText,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import {
  useGetDashboardStats,
  useListPartnerReviews,
  useListProjects,
} from "@workspace/api-client-react";

function ScoreBar({
  label,
  value,
  max = 5,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">
          {value.toFixed(1)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminStats() {
  const { data: stats, isLoading: sLoading } = useGetDashboardStats();
  const { data: projects = [], isLoading: pLoading } = useListProjects();
  const { data: reviews = [], isLoading: rLoading } = useListPartnerReviews();
  const isLoading = sLoading || pLoading || rLoading;

  const byType = stats?.projectsByType ?? [];
  const maxTypeCount = Math.max(1, ...byType.map((t) => t.count));
  const totalProjects = stats?.totalProjects ?? projects.length;
  const conversionRate =
    totalProjects > 0
      ? Math.round(((stats?.deliveredProjects ?? 0) / totalProjects) * 100)
      : 0;
  const partnerScores = new Map<
    string,
    { name: string; total: number; count: number }
  >();
  for (const review of reviews) {
    if (review.rating === null) continue;
    const current = partnerScores.get(review.partnerId) ?? {
      name: review.partnerName,
      total: 0,
      count: 0,
    };
    current.total += review.rating;
    current.count += 1;
    partnerScores.set(review.partnerId, current);
  }
  const rankedPartners = Array.from(partnerScores, ([id, score]) => ({
    id,
    name: score.name,
    count: score.count,
    average: score.total / score.count,
  })).sort((a, b) => b.average - a.average);
  const advisorLoads = new Map<string, number>();
  for (const project of projects) {
    if (
      project.advisorUserId &&
      !["termine", "annule", "archive"].includes(project.status)
    ) {
      advisorLoads.set(
        project.advisorUserId,
        (advisorLoads.get(project.advisorUserId) ?? 0) + 1,
      );
    }
  }
  const advisorRows = Array.from(advisorLoads, ([id, activeProjects]) => ({
    id,
    activeProjects,
  })).sort((a, b) => b.activeProjects - a.activeProjects);

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
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Scores & statistiques
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Vue globale de la performance de la plateforme.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Projets totaux"
            value={totalProjects}
            icon={FolderOpen}
            description="Depuis le lancement"
          />
          <StatCard
            label="Projets livrés"
            value={stats?.deliveredProjects ?? 0}
            icon={Star}
            description="Terminés et validés"
          />
          <StatCard
            label="Taux de livraison"
            value={`${conversionRate}%`}
            icon={BarChart3}
            description="Projets terminés / total"
          />
          <StatCard
            label="CA total"
            value={stats ? `${(stats.revenueTotal / 1000).toFixed(1)}k €` : "—"}
            icon={Users}
            description="Ensemble des projets"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Répartition par type */}
          <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" /> Répartition
              par type
            </h2>
            {byType.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun projet pour l'instant
              </p>
            ) : (
              <div className="space-y-2">
                {byType
                  .sort((a, b) => b.count - a.count)
                  .map((t) => (
                    <ScoreBar
                      key={t.type}
                      label={t.type}
                      value={(t.count / maxTypeCount) * 5}
                    />
                  ))}
              </div>
            )}
          </section>

          {/* Répartition par statut */}
          <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-violet-400" /> Répartition
              par statut
            </h2>
            {(stats?.projectsByStatus ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun projet pour l'instant
              </p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-card/50">
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                        Statut
                      </th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">
                        Projets
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.projectsByStatus ?? [])
                      .sort((a, b) => b.count - a.count)
                      .map((s, i, arr) => (
                        <tr
                          key={s.status}
                          className={
                            i < arr.length - 1 ? "border-b border-border" : ""
                          }
                        >
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {s.status}
                          </td>
                          <td className="px-3 py-2 text-right text-sm font-bold">
                            {s.count}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="space-y-4 rounded-lg border border-border bg-card p-5">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 text-emerald-400" />
              Évaluations partenaires
            </h2>
            {rankedPartners.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune mission évaluée
              </p>
            ) : (
              <div className="space-y-3">
                {rankedPartners.slice(0, 8).map((partner) => (
                  <div key={partner.id} className="space-y-1">
                    <ScoreBar
                      label={`${partner.name} · ${partner.count} avis`}
                      value={partner.average}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="space-y-4 rounded-lg border border-border bg-card p-5">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-blue-400" />
              Charge des conseillers
            </h2>
            {advisorRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucun projet affecté
              </p>
            ) : (
              <div className="space-y-3">
                {advisorRows.slice(0, 8).map((advisor) => (
                  <div key={advisor.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate font-mono text-muted-foreground">
                        {advisor.id}
                      </span>
                      <span className="font-semibold">
                        {advisor.activeProjects}/80
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.min(100, (advisor.activeProjects / 80) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
