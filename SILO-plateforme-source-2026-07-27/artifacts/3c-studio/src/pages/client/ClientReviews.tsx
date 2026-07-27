import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, Star } from "lucide-react";
import {
  getListPartnerReviewsQueryKey,
  useCreatePartnerReview,
  useListPartnerReviews,
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ReviewDraft {
  missionId: number;
  rating: number;
  comment: string;
}

function Stars({
  value,
  onChange,
}: {
  value: number;
  onChange?: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          disabled={!onChange}
          aria-label={`${rating} étoile${rating > 1 ? "s" : ""}`}
          onClick={() => onChange?.(rating)}
          className={cn("transition-transform", onChange && "hover:scale-110")}
        >
          <Star
            className={cn(
              "h-4 w-4",
              rating <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function ClientReviews() {
  const [draft, setDraft] = useState<ReviewDraft | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: reviews = [], isLoading, error } = useListPartnerReviews();
  const createReview = useCreatePartnerReview({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: getListPartnerReviewsQueryKey(),
        });
        setDraft(null);
        toast({
          title: "Évaluation enregistrée",
          description:
            "Votre retour contribue au suivi qualité des partenaires SILO.",
        });
      },
      onError: () => {
        toast({
          title: "Évaluation non enregistrée",
          description:
            "La mission a peut-être déjà été évaluée ou n’est pas encore clôturée.",
          variant: "destructive",
        });
      },
    },
  });

  const submit = () => {
    if (!draft) return;
    createReview.mutate({
      data: {
        missionId: draft.missionId,
        rating: draft.rating,
        comment: draft.comment.trim() || null,
      },
    });
  };

  const pending = reviews.filter((review) => review.rating === null);
  const done = reviews.filter((review) => review.rating !== null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Évaluations
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Notez les missions clôturées. Chaque retour est rattaché au
            partenaire réellement intervenu.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            Les évaluations n’ont pas pu être chargées.
          </div>
        )}

        {!isLoading && !error && (
          <>
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                À évaluer ({pending.length})
              </h2>
              {pending.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                  Aucune prestation à évaluer.
                </p>
              ) : (
                pending.map((review) => (
                  <div
                    key={review.missionId}
                    className="space-y-3 rounded-lg border border-border bg-card p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {review.projectTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {review.partnerName}
                          {review.deliveredAt
                            ? ` · livré le ${new Date(review.deliveredAt).toLocaleDateString("fr-FR")}`
                            : ""}
                        </p>
                      </div>
                      {draft?.missionId !== review.missionId && (
                        <Button
                          size="sm"
                          onClick={() =>
                            setDraft({
                              missionId: review.missionId,
                              rating: 5,
                              comment: "",
                            })
                          }
                        >
                          Noter
                        </Button>
                      )}
                    </div>
                    {draft?.missionId === review.missionId && (
                      <div className="space-y-3 border-t border-border pt-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            Votre note :
                          </span>
                          <Stars
                            value={draft.rating}
                            onChange={(rating) =>
                              setDraft({ ...draft, rating })
                            }
                          />
                        </div>
                        <textarea
                          value={draft.comment}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              comment: event.target.value,
                            })
                          }
                          placeholder="Un commentaire factuel (facultatif)"
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                          rows={3}
                          maxLength={2000}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDraft(null)}
                            disabled={createReview.isPending}
                          >
                            Annuler
                          </Button>
                          <Button
                            size="sm"
                            onClick={submit}
                            disabled={createReview.isPending}
                          >
                            {createReview.isPending && (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            )}
                            Envoyer
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mes évaluations passées
              </h2>
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                {done.length === 0 && (
                  <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                    Aucune évaluation enregistrée.
                  </p>
                )}
                {done.map((review) => (
                  <div
                    key={review.missionId}
                    className="flex items-start gap-4 px-5 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {review.projectTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {review.partnerName}
                      </p>
                      {review.comment && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          « {review.comment} »
                        </p>
                      )}
                    </div>
                    <Stars value={review.rating ?? 0} />
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
