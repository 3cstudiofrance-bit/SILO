import { useMemo } from "react";
import {
  Calendar,
  Clock,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import {
  useListPartnerMissions,
  useListProjects,
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { cn } from "@/lib/utils";

type PlanningEvent = {
  id: string;
  date: string;
  title: string;
  type: "shooting" | "delivery";
  location: string;
  team: string[];
  time: string;
};

const TYPE_CONFIG = {
  shooting: {
    label: "Tournage",
    color: "border-primary bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  delivery: {
    label: "Livraison",
    color: "border-blue-500 bg-blue-500/10 text-blue-400",
    dot: "bg-blue-400",
  },
} as const;

export default function PMPlanning() {
  const { data: projects = [], isLoading: projectsLoading } =
    useListProjects();
  const { data: missions = [], isLoading: missionsLoading } =
    useListPartnerMissions();
  const events = useMemo<PlanningEvent[]>(() => {
    const rows: PlanningEvent[] = [];
    for (const project of projects) {
      if (project.shootingDate) {
        rows.push({
          id: `project-${project.id}-shooting`,
          date: project.shootingDate,
          title: `Tournage · ${project.title}`,
          type: "shooting",
          location: "Lieu à confirmer",
          team: [project.clientName, "Conseiller SILO"],
          time: "Horaire à confirmer",
        });
      }
      if (project.deliveryDate) {
        rows.push({
          id: `project-${project.id}-delivery`,
          date: project.deliveryDate,
          title: `Livraison client · ${project.title}`,
          type: "delivery",
          location: "En ligne",
          team: [project.clientName, "Conseiller SILO"],
          time: "Horaire à confirmer",
        });
      }
    }
    for (const mission of missions) {
      if (mission.dueDate) {
        rows.push({
          id: `mission-${mission.id}-delivery`,
          date: mission.dueDate,
          title: `Livraison partenaire · ${mission.title}`,
          type: "delivery",
          location: "Espace livrables SILO",
          team: [mission.partnerName, "Conseiller SILO"],
          time: "Avant fin de journée",
        });
      }
    }
    return rows.sort((left, right) => left.date.localeCompare(right.date));
  }, [missions, projects]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((event) => event.date >= today);
  const past = events
    .filter((event) => event.date < today)
    .slice()
    .reverse()
    .slice(0, 10);
  const isLoading = projectsLoading || missionsLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Planning</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {upcoming.length} échéance{upcoming.length > 1 ? "s" : ""} à venir
            dans vos projets et missions.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          {Object.entries(TYPE_CONFIG).map(([type, config]) => (
            <div
              key={type}
              className={cn(
                "flex items-center gap-2 border px-3 py-1 text-xs font-medium",
                config.color,
              )}
            >
              <div className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
              {config.label}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-border py-20 text-center">
            <Calendar className="mb-3 h-9 w-9 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              Aucune date planifiée
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Renseignez les dates de tournage et de livraison sur les projets.
            </p>
          </div>
        ) : (
          <>
            <EventSection title="À venir" events={upcoming} />
            {past.length > 0 && (
              <EventSection title="Échéances passées" events={past} past />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function EventSection({
  title,
  events,
  past = false,
}: {
  title: string;
  events: PlanningEvent[];
  past?: boolean;
}) {
  if (events.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {events.map((event) => {
        const config = TYPE_CONFIG[event.type];
        const date = new Date(`${event.date}T12:00:00`);
        return (
          <div
            key={event.id}
            className={cn(
              "border border-l-4 border-border bg-card p-4",
              config.color.split(" ")[0],
              past && "opacity-55",
            )}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 flex-shrink-0 text-center">
                <p className="text-[10px] uppercase text-muted-foreground/70">
                  {date.toLocaleDateString("fr-FR", { month: "short" })}
                </p>
                <p className="text-xl font-bold leading-tight text-foreground">
                  {date.getDate()}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-semibold",
                    config.color,
                  )}
                >
                  {config.label}
                </span>
                <h3 className="mt-1 text-sm font-semibold text-foreground">
                  {event.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                    <Clock className="h-3 w-3" />
                    {event.time}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                    <MapPin className="h-3 w-3" />
                    {event.location}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                    <Users className="h-3 w-3" />
                    {event.team.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
