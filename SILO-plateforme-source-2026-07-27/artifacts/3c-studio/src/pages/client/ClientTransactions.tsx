import { DashboardLayout } from "@/components/DashboardLayout";
import {
  AlertCircle,
  CircleCheck,
  CreditCard,
  Euro,
  Info,
  Loader2,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/shared/StatCard";
import { formatEUR } from "@/lib/finance";
import {
  useCreateTransactionCheckout,
  useListTransactions,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const PAYMENT_STATUS = {
  en_attente_paiement: {
    label: "À régler",
    className: "text-amber-400 bg-amber-500/10",
  },
  confirmee: {
    label: "Payée",
    className: "text-emerald-400 bg-emerald-500/10",
  },
  echouee: {
    label: "Échec",
    className: "text-red-400 bg-red-500/10",
  },
  annulee: {
    label: "Annulée",
    className: "text-muted-foreground bg-muted",
  },
  remboursee: {
    label: "Remboursée",
    className: "text-blue-400 bg-blue-500/10",
  },
} as const;

function extractServerError(error: unknown): string {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
    ) {
      return (data as { error: string }).error;
    }
  }
  return "Impossible d’ouvrir le paiement pour le moment.";
}

export default function ClientTransactions() {
  const { toast } = useToast();
  // L'API ne renvoie au client QUE ses transactions, avec le montant total seul
  // (répartition 70/20/10 et FRP masqués côté serveur).
  const { data: transactions, isLoading, error } = useListTransactions();
  const checkout = useCreateTransactionCheckout({
    mutation: {
      onSuccess: ({ url }) => {
        window.location.assign(url);
      },
      onError: (checkoutError: unknown) => {
        toast({
          title: "Paiement indisponible",
          description: extractServerError(checkoutError),
          variant: "destructive",
        });
      },
    },
  });

  const txs = transactions ?? [];
  const confirmed = txs.filter((t) => t.status === "confirmee");
  const payable = txs.filter(
    (transaction) =>
      transaction.status === "en_attente_paiement" ||
      transaction.status === "echouee",
  );
  const totalTtc = confirmed.reduce((s, t) => s + (t.ttc ?? 0), 0);
  const paymentResult = new URLSearchParams(window.location.search).get(
    "payment",
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Mes transactions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Historique de vos paiements auprès de Silo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total réglé (TTC)"
            value={formatEUR(totalTtc)}
            icon={Euro}
            description="Transactions confirmées"
          />
          <StatCard
            label="Transactions"
            value={confirmed.length}
            icon={Receipt}
            description="Confirmées à ce jour"
          />
          <StatCard
            label="À régler"
            value={payable.length}
            icon={CreditCard}
            description="Demandes de paiement ouvertes"
          />
        </div>

        {paymentResult === "success" && (
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3.5">
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <p className="text-sm text-emerald-300">
              Paiement reçu. La confirmation signée de Stripe peut prendre
              quelques secondes à apparaître.
            </p>
          </div>
        )}
        {paymentResult === "cancelled" && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-sm text-amber-300">
              Le paiement a été interrompu. La demande reste disponible.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
          </div>
        )}
        {error && (
          <p className="text-sm text-destructive">
            Impossible de charger vos transactions. Veuillez réessayer.
          </p>
        )}

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Détail des transactions
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Prestation
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                    Date
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">
                    Statut
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Montant HT
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Montant TTC
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {txs.length === 0 && !isLoading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-sm text-muted-foreground"
                    >
                      Aucune transaction pour le moment.
                    </td>
                  </tr>
                )}
                {txs.map((t, i) => {
                  const status = PAYMENT_STATUS[t.status];
                  const canPay =
                    t.status === "en_attente_paiement" ||
                    t.status === "echouee";
                  const isOpening =
                    checkout.isPending && checkout.variables?.id === t.id;
                  return (
                    <tr
                      key={t.id}
                      className={cn(
                        "hover:bg-card/50 transition-colors",
                        i < txs.length - 1 && "border-b border-border",
                      )}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{t.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.kind === "abonnement"
                            ? "Abonnement"
                            : "Prestation ponctuelle"}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium",
                            status.className,
                          )}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {t.amountHt != null ? formatEUR(t.amountHt) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold">
                        {t.ttc != null ? formatEUR(t.ttc) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canPay ? (
                          <Button
                            size="sm"
                            className="gap-1.5"
                            disabled={checkout.isPending}
                            onClick={() => checkout.mutate({ id: t.id })}
                          >
                            {isOpening ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CreditCard className="h-3.5 w-3.5" />
                            )}
                            Régler
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-400/5 border border-blue-400/20">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Les montants affichés correspondent au total de vos règlements. Un
              chef de projet Silo reste votre interlocuteur unique pour toute
              question de facturation.
            </p>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
