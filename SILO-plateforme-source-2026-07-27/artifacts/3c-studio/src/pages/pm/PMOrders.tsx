import { Link } from "wouter";
import {
  AlertCircle,
  Calendar,
  Clock,
  Euro,
  Loader2,
  Package,
  User,
} from "lucide-react";
import {
  useListProjects,
  type Project,
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { cn } from "@/lib/utils";

const PROJECT_TYPE_LABELS: Record<Project["type"], string> = {
  mariage: "Vidéo de mariage",
  clip: "Clip musical",
  corporate: "Film corporate",
  reseaux: "Contenus réseaux sociaux",
};

const STATUS_CONFIG: Record<
  Project["status"],
  { label: string; dot: string; section: "new" | "processing" | "done" }
> = {
  lead: { label: "À cadrer", dot: "bg-primary", section: "new" },
  devis: { label: "Devis", dot: "bg-blue-400", section: "new" },
  production: {
    label: "Production",
    dot: "bg-amber-400",
    section: "processing",
  },
  post_production: {
    label: "Postproduction",
    dot: "bg-violet-400",
    section: "processing",
  },
  livraison: {
    label: "Livraison",
    dot: "bg-cyan-400",
    section: "processing",
  },
  termine: { label: "Terminé", dot: "bg-emerald-400", section: "done" },
  annule: { label: "Annulé", dot: "bg-red-400", section: "done" },
};

function relativeDate(iso: string): string {
  const hours = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000),
  );
  if (hours < 1) return "à l’instant";
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

function isHighPriority(project: Project): boolean {
  if (!project.deliveryDate) return false;
  const days =
    (new Date(project.deliveryDate).getTime() - Date.now()) / 86_400_000;
  return days <= 14;
}

export default function PMOrders() {
  const { data: projects = [], isLoading, isError } = useListProjects();
  const activeProjects = projects.filter(
    (project) => STATUS_CONFIG[project.status].section !== "done",
  );
  const newOrders = activeProjects.filter(
    (project) => STATUS_CONFIG[project.status].section === "new",
  );
  const processing = activeProjects.filter(
    (project) => STATUS_CONFIG[project.status].section === "processing",
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Commandes suivies
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {newOrders.length} commande
            {newOrders.length > 1 ? "s" : ""} à cadrer, {processing.length} en
            production
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex items-center gap-3 border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            Les commandes n’ont pas pu être chargées.
          </div>
        ) : activeProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-border py-20 text-center">
            <Package className="mb-3 h-9 w-9 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              Aucune commande active
            </p>
          </div>
        ) : (
          <>
            {newOrders.length > 0 && (
              <ProjectSection
                title="À cadrer"
                dotClassName="bg-primary animate-pulse"
                projects={newOrders}
              />
            )}
            {processing.length > 0 && (
              <ProjectSection
                title="En production"
                dotClassName="bg-amber-400"
                projects={processing}
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function ProjectSection({
  title,
  dotClassName,
  projects,
}: {
  title: string;
  dotClassName: string;
  projects: Project[];
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn("h-2 w-2 rounded-full", dotClassName)} />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
      </div>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </section>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const priority = isHighPriority(project);
  const status = STATUS_CONFIG[project.status];

  return (
    <div className="border border-border bg-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-secondary">
          <Package className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground/70">
              CMD-{String(project.id).padStart(5, "0")}
            </span>
            <div
              className={cn(
                "border px-2 py-0.5 text-xs font-medium",
                priority
                  ? "border-red-500/20 bg-red-500/10 text-red-400"
                  : "border-border bg-secondary text-slate-400",
              )}
            >
              {priority ? "Priorité haute" : "Normale"}
            </div>
            <div className="flex items-center gap-1">
              <div className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
              <span className="text-xs text-muted-foreground/70">
                {status.label}
              </span>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-foreground">
            {PROJECT_TYPE_LABELS[project.type]} · {project.clientName}
          </h3>
          {project.description && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
              <User className="h-3 w-3" /> {project.clientName}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
              <Calendar className="h-3 w-3" />
              {project.deliveryDate
                ? new Date(project.deliveryDate).toLocaleDateString("fr-FR")
                : "Échéance à définir"}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <Euro className="h-3 w-3" />
              {project.amount !== null && project.amount !== undefined
                ? `${project.amount.toLocaleString("fr-FR")} EUR HT`
                : "Budget à qualifier"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
              <Clock className="h-3 w-3" /> Reçu{" "}
              {relativeDate(project.createdAt)}
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 gap-2 md:flex-col">
          <Link
            href="/pm/attribution"
            className="bg-primary px-4 py-1.5 text-center text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Attribuer
          </Link>
          <Link
            href="/pm/livrables"
            className="border border-border bg-secondary px-4 py-1.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Livrables
          </Link>
        </div>
      </div>
    </div>
  );
}
