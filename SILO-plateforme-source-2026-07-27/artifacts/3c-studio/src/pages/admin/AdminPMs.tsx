import { DashboardLayout } from "@/components/DashboardLayout";
import {
  AlertTriangle,
  FolderOpen,
  Loader2,
  UserCog,
  UserRoundCheck,
} from "lucide-react";
import { useListProjects } from "@workspace/api-client-react";
import {
  ADVISOR_MAX_ACTIVE_PROJECTS,
  ADVISOR_WARNING_ACTIVE_PROJECTS,
} from "@/lib/finance";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/shared/StatCard";

const TERMINAL_STATUSES = new Set(["archive", "termine", "annule"]);

export default function AdminPMs() {
  const { data: projects = [], isLoading } = useListProjects();
  const advisors = new Map<
    string,
    { userId: string; activeProjects: number; totalProjects: number }
  >();

  for (const project of projects) {
    if (!project.advisorUserId) continue;
    const current = advisors.get(project.advisorUserId) ?? {
      userId: project.advisorUserId,
      activeProjects: 0,
      totalProjects: 0,
    };
    current.totalProjects += 1;
    if (!TERMINAL_STATUSES.has(project.status)) {
      current.activeProjects += 1;
    }
    advisors.set(project.advisorUserId, current);
  }

  const rows = Array.from(advisors.values()).sort(
    (a, b) => b.activeProjects - a.activeProjects,
  );
  const unassigned = projects.filter((project) => !project.advisorUserId).length;
  const warnings = rows.filter(
    (advisor) =>
      advisor.activeProjects >= ADVISOR_WARNING_ACTIVE_PROJECTS,
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conseillers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Charge, capacité et affectations des conseillers SILO.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Conseillers affectés"
            value={rows.length}
            icon={UserRoundCheck}
            description="Avec au moins un dossier"
          />
          <StatCard
            label="Projets non affectés"
            value={unassigned}
            icon={FolderOpen}
            description="À attribuer"
            accent={unassigned > 0 ? "text-amber-400" : undefined}
          />
          <StatCard
            label="Alertes de capacité"
            value={warnings}
            icon={AlertTriangle}
            description={`Seuil à ${ADVISOR_WARNING_ACTIVE_PROJECTS} dossiers`}
            accent={warnings > 0 ? "text-red-400" : undefined}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border text-center">
            <UserCog className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              Aucun conseiller affecté
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-sm">
              Affectez un identifiant Clerk conseiller depuis la fiche d’un
              projet pour commencer le suivi de charge.
            </p>
          </div>
        ) : (
          <div className="border border-border overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Conseiller
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
                    Actifs
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Charge
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
                    Total historique
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    État
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((advisor, index) => {
                  const full =
                    advisor.activeProjects >= ADVISOR_MAX_ACTIVE_PROJECTS;
                  const warning =
                    advisor.activeProjects >=
                    ADVISOR_WARNING_ACTIVE_PROJECTS;
                  const load = Math.min(
                    100,
                    (advisor.activeProjects /
                      ADVISOR_MAX_ACTIVE_PROJECTS) *
                      100,
                  );
                  return (
                    <tr
                      key={advisor.userId}
                      className={cn(
                        "hover:bg-card/50 transition-colors",
                        index < rows.length - 1 &&
                          "border-b border-border",
                      )}
                    >
                      <td className="px-4 py-3 text-xs font-mono">
                        {advisor.userId}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">
                        {advisor.activeProjects}/
                        {ADVISOR_MAX_ACTIVE_PROJECTS}
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-2 w-full bg-secondary overflow-hidden">
                          <div
                            className={cn(
                              "h-full",
                              full
                                ? "bg-red-500"
                                : warning
                                  ? "bg-amber-400"
                                  : "bg-emerald-500",
                            )}
                            style={{ width: `${load}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {advisor.totalProjects}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            full
                              ? "text-red-400"
                              : warning
                                ? "text-amber-400"
                                : "text-emerald-400",
                          )}
                        >
                          {full
                            ? "Capacité atteinte"
                            : warning
                              ? "Anticipation requise"
                              : "Disponible"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
