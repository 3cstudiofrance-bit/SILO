import { useMemo } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  File,
  FileText,
  Film,
  Image,
  Loader2,
  Music,
  Package,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import {
  getListDeliverablesQueryKey,
  listDeliverables,
  useListProjects,
  useReviewDeliverable,
  type Deliverable,
  type Project,
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SecureFileLink } from "@/components/files/SecureFileLink";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type DeliverableRow = Deliverable & { project: Project };

const STATUS_CONFIG: Record<
  Deliverable["status"],
  {
    label: string;
    icon: typeof Clock;
    color: string;
    background: string;
  }
> = {
  pending_review: {
    label: "En attente de validation",
    icon: Clock,
    color: "text-amber-400",
    background: "bg-amber-500/10 border-amber-500/20",
  },
  approved: {
    label: "Validé",
    icon: CheckCircle,
    color: "text-emerald-400",
    background: "bg-emerald-500/10 border-emerald-500/20",
  },
  changes_requested: {
    label: "Corrections demandées",
    icon: AlertCircle,
    color: "text-red-400",
    background: "bg-red-500/10 border-red-500/20",
  },
};

const TYPE_CONFIG: Record<
  Deliverable["type"],
  { icon: typeof Film; color: string }
> = {
  video: { icon: Film, color: "text-violet-400" },
  photo: { icon: Image, color: "text-blue-400" },
  audio: { icon: Music, color: "text-pink-400" },
  document: { icon: FileText, color: "text-slate-400" },
  autre: { icon: File, color: "text-slate-400" },
};

const CLIENT_STATUS = {
  pending: {
    label: "Validation client en attente",
    className: "text-amber-400",
  },
  approved: {
    label: "Validé par le client",
    className: "text-emerald-400",
  },
  changes_requested: {
    label: "Corrections demandées par le client",
    className: "text-red-400",
  },
} as const;

export default function PMDeliverables() {
  const { data: projects = [], isLoading: projectsLoading } = useListProjects();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const reviewDeliverable = useReviewDeliverable();
  const deliverableQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: getListDeliverablesQueryKey(project.id),
      queryFn: () => listDeliverables(project.id),
    })),
  });

  const deliverables = useMemo(
    () =>
      deliverableQueries.flatMap((query, index) =>
        (query.data ?? []).map((deliverable) => ({
          ...deliverable,
          project: projects[index],
        })),
      ),
    [deliverableQueries, projects],
  );
  const pending = deliverables.filter(
    (deliverable) => deliverable.status === "pending_review",
  );
  const reviewed = deliverables.filter(
    (deliverable) => deliverable.status !== "pending_review",
  );
  const isLoading =
    projectsLoading || deliverableQueries.some((query) => query.isLoading);
  const isError = deliverableQueries.some((query) => query.isError);

  const review = (
    deliverable: DeliverableRow,
    status: "approved" | "changes_requested",
  ) => {
    const notes =
      status === "changes_requested"
        ? window.prompt("Précisez les corrections attendues :")?.trim()
        : undefined;
    if (status === "changes_requested" && !notes) return;

    reviewDeliverable.mutate(
      {
        id: deliverable.id,
        data: { status, notes },
      },
      {
        onSuccess: (updated) => {
          void queryClient.invalidateQueries({
            queryKey: getListDeliverablesQueryKey(updated.projectId),
          });
          toast({
            title:
              status === "approved"
                ? "Livrable validé"
                : "Corrections demandées",
          });
        },
        onError: (error) => {
          toast({
            title: "La revue a échoué",
            description: error instanceof Error ? error.message : undefined,
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Validation des livrables
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pending.length} livrable{pending.length > 1 ? "s" : ""} en attente
            de validation
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex items-center gap-3 border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            Certains livrables n’ont pas pu être chargés.
          </div>
        ) : deliverables.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-border py-20 text-center">
            <Package className="mb-3 h-9 w-9 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              Aucun livrable reçu
            </p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    À valider
                  </h2>
                </div>
                {pending.map((deliverable) => (
                  <DeliverableCard
                    key={deliverable.id}
                    deliverable={deliverable}
                    isReviewing={
                      reviewDeliverable.isPending &&
                      reviewDeliverable.variables?.id === deliverable.id
                    }
                    onApprove={() => review(deliverable, "approved")}
                    onRequestChanges={() =>
                      review(deliverable, "changes_requested")
                    }
                  />
                ))}
              </section>
            )}

            {reviewed.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Historique
                </h2>
                {reviewed.map((deliverable) => (
                  <ReviewedRow key={deliverable.id} deliverable={deliverable} />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function DeliverableCard({
  deliverable,
  isReviewing,
  onApprove,
  onRequestChanges,
}: {
  deliverable: DeliverableRow;
  isReviewing: boolean;
  onApprove: () => void;
  onRequestChanges: () => void;
}) {
  const status = STATUS_CONFIG[deliverable.status];
  const type = TYPE_CONFIG[deliverable.type];
  const TypeIcon = type.icon;
  const StatusIcon = status.icon;

  return (
    <div className="border border-border bg-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center border border-border bg-secondary">
          <TypeIcon className={cn("h-5 w-5", type.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1 border px-2 py-0.5 text-xs font-medium",
                status.background,
                status.color,
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
            <span className="text-xs text-muted-foreground/70">
              v{deliverable.version}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {deliverable.name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground/70">
            {deliverable.project.title} ·{" "}
            {deliverable.size || "Taille non renseignée"} ·{" "}
            {new Date(deliverable.createdAt).toLocaleString("fr-FR")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SecureFileLink
            reference={deliverable.url}
            className="flex items-center gap-1.5 border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Eye className="h-3.5 w-3.5" /> Voir
          </SecureFileLink>
          <button
            type="button"
            onClick={onApprove}
            disabled={isReviewing}
            className="flex items-center gap-1.5 border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {isReviewing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ThumbsUp className="h-3.5 w-3.5" />
            )}
            Valider
          </button>
          <button
            type="button"
            onClick={onRequestChanges}
            disabled={isReviewing}
            className="flex items-center gap-1.5 border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
          >
            <ThumbsDown className="h-3.5 w-3.5" /> Corrections
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewedRow({ deliverable }: { deliverable: DeliverableRow }) {
  const status = STATUS_CONFIG[deliverable.status];
  const type = TYPE_CONFIG[deliverable.type];
  const TypeIcon = type.icon;
  const StatusIcon = status.icon;
  const clientStatus = CLIENT_STATUS[deliverable.clientStatus];

  return (
    <div className="flex items-center gap-4 border border-border bg-card p-4 opacity-80">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center border border-border bg-secondary">
        <TypeIcon className={cn("h-4 w-4", type.color)} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-xs font-semibold text-foreground">
          {deliverable.name}
        </h3>
        <p className="mt-0.5 text-[10px] text-muted-foreground/70">
          {deliverable.project.title} ·{" "}
          {deliverable.reviewedAt
            ? new Date(deliverable.reviewedAt).toLocaleString("fr-FR")
            : "Revue enregistrée"}
        </p>
        {deliverable.reviewNotes && (
          <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">
            {deliverable.reviewNotes}
          </p>
        )}
        {deliverable.status === "approved" && (
          <>
            <p className={cn("mt-1 text-[10px]", clientStatus.className)}>
              {clientStatus.label}
            </p>
            {deliverable.clientReviewNotes && (
              <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
                {deliverable.clientReviewNotes}
              </p>
            )}
          </>
        )}
      </div>
      <span
        className={cn(
          "flex items-center gap-1 border px-2 py-0.5 text-[10px] font-medium",
          status.background,
          status.color,
        )}
      >
        <StatusIcon className="h-3 w-3" />
        {status.label}
      </span>
      <SecureFileLink
        reference={deliverable.url}
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center border border-border bg-secondary text-muted-foreground/70 transition-colors hover:text-foreground"
        title="Ouvrir le livrable"
      >
        <Download className="h-3.5 w-3.5" />
      </SecureFileLink>
    </div>
  );
}
