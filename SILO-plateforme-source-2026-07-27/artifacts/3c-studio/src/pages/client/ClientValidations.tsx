import { useMemo } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  MessageSquare,
  XCircle,
} from "lucide-react";
import {
  getListDeliverablesQueryKey,
  listDeliverables,
  useListProjects,
  useReviewDeliverableAsClient,
  type Deliverable,
  type Project,
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SecureFileLink } from "@/components/files/SecureFileLink";
import { Button } from "@/components/ui/button";
import { useFeature } from "@/lib/feature-flags";
import { useToast } from "@/hooks/use-toast";

type DeliverableRow = Deliverable & { project: Project };

export default function ClientValidations() {
  const canValidate = useFeature("validation_livrables_client", {
    role: "client",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: projects = [], isLoading: projectsLoading } = useListProjects();
  const deliverableQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: getListDeliverablesQueryKey(project.id),
      queryFn: () => listDeliverables(project.id),
    })),
  });
  const review = useReviewDeliverableAsClient();

  const items = useMemo(
    () =>
      deliverableQueries.flatMap((query, index) =>
        (query.data ?? []).map((deliverable) => ({
          ...deliverable,
          project: projects[index],
        })),
      ),
    [deliverableQueries, projects],
  );
  const pending = items.filter((item) => item.clientStatus === "pending");
  const done = items.filter((item) => item.clientStatus !== "pending");
  const isLoading =
    projectsLoading || deliverableQueries.some((query) => query.isLoading);
  const isError = deliverableQueries.some((query) => query.isError);

  const act = (
    item: DeliverableRow,
    status: "approved" | "changes_requested",
  ) => {
    const notes =
      status === "changes_requested"
        ? window
            .prompt("Décrivez précisément les corrections attendues :")
            ?.trim()
        : undefined;
    if (status === "changes_requested" && !notes) return;

    review.mutate(
      { id: item.id, data: { status, notes } },
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
            description:
              status === "approved"
                ? "Votre validation finale a été enregistrée."
                : "Votre demande a été transmise à votre conseiller SILO.",
          });
        },
        onError: () => {
          toast({
            title: "Validation non enregistrée",
            description:
              "Actualisez la page ou contactez votre conseiller SILO.",
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
            Validations
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Validez les livrables contrôlés par SILO ou demandez des
            corrections.
          </p>
        </div>

        {!canValidate && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-4">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-xs text-muted-foreground">
              La validation en ligne n’est pas activée pour votre compte. Votre
              conseiller recueillera votre décision directement.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex items-center gap-3 rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            Certains livrables n’ont pas pu être chargés.
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                En attente de votre validation ({pending.length})
              </h2>
              {pending.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                  Aucun livrable en attente.
                </p>
              ) : (
                pending.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.project.title} · version {item.version} · soumis
                        le{" "}
                        {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <SecureFileLink
                        reference={item.url}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Consulter
                      </SecureFileLink>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!canValidate || review.isPending}
                        onClick={() => act(item, "changes_requested")}
                        className="text-amber-400"
                      >
                        <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                        Corrections
                      </Button>
                      <Button
                        size="sm"
                        disabled={!canValidate || review.isPending}
                        onClick={() => act(item, "approved")}
                      >
                        {review.isPending &&
                        review.variables?.id === item.id ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Valider
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Historique
              </h2>
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                {done.length === 0 && (
                  <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                    Aucune validation enregistrée.
                  </p>
                )}
                {done.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 px-5 py-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.project.title}
                      </p>
                      {item.clientReviewNotes && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.clientReviewNotes}
                        </p>
                      )}
                    </div>
                    {item.clientStatus === "approved" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                        <CheckCircle className="h-3 w-3" /> Validé
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                        <XCircle className="h-3 w-3" /> Corrections demandées
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
