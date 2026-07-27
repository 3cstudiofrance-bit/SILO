import { CheckCircle, CreditCard, Loader2 } from "lucide-react";
import { useListTransactions } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { SOCIAL_PACKS, formatEUR } from "@/lib/finance";
import { cn } from "@/lib/utils";

export default function AdminSubscriptions() {
  const { data: transactions = [], isLoading } = useListTransactions();
  const subscriptions = transactions.filter(
    (transaction) => transaction.kind === "abonnement",
  );
  const now = new Date();
  const paidThisMonth = subscriptions.filter((transaction) => {
    if (transaction.status !== "confirmee") return false;
    const paidAt = new Date(transaction.paidAt ?? transaction.date);
    return (
      paidAt.getFullYear() === now.getFullYear() &&
      paidAt.getMonth() === now.getMonth()
    );
  });
  const totals = paidThisMonth.reduce(
    (sum, transaction) => ({
      ht: sum.ht + (transaction.amountHt ?? 0),
      silo: sum.silo + (transaction.partSilo ?? 0),
      frp: sum.frp + (transaction.partFrp ?? 0),
    }),
    { ht: 0, silo: 0, frp: 0 },
  );
  const pending = subscriptions.filter(
    (transaction) =>
      transaction.status === "en_attente_paiement" ||
      transaction.status === "echouee",
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Abonnements</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Échéances mensuelles sans engagement et ventilation sur le HT.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Échéances réglées"
            value={paidThisMonth.length}
            icon={CreditCard}
            description="Mois en cours"
          />
          <StatCard
            label="Volume HT du mois"
            value={formatEUR(totals.ht)}
            icon={CreditCard}
            description={`${pending} en attente`}
          />
          <StatCard
            label="Part SILO brute"
            value={formatEUR(totals.silo)}
            icon={CreditCard}
            description="20 % du HT réglé"
          />
          <StatCard
            label="FRP crédité"
            value={formatEUR(totals.frp)}
            icon={CreditCard}
            description="10 % du HT réglé"
          />
        </div>

        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Catalogue des packs
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {SOCIAL_PACKS.map((pack) => (
              <div
                key={pack.id}
                className="space-y-3 rounded-lg border border-border bg-card p-5"
              >
                <div>
                  <p className="text-sm font-semibold">{pack.name}</p>
                  <p className="mt-1 text-2xl font-bold">
                    {formatEUR(pack.priceHT)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      HT / mois
                    </span>
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {pack.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <CheckCircle className="h-3 w-3 shrink-0 text-emerald-400" />{" "}
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Historique des échéances
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
              <CreditCard className="mb-3 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Aucune échéance d’abonnement
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="border-b border-border bg-card/50">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Échéance
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Partenaire
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Statut
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                      HT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((transaction, index) => (
                    <tr
                      key={transaction.id}
                      className={cn(
                        index < subscriptions.length - 1 &&
                          "border-b border-border",
                      )}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">
                          {transaction.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString(
                            "fr-FR",
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {transaction.agencyName}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-xs",
                          transaction.status === "confirmee"
                            ? "text-emerald-400"
                            : "text-amber-400",
                        )}
                      >
                        {transaction.status === "confirmee"
                          ? "Réglée"
                          : "En attente"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">
                        {formatEUR(transaction.amountHt ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
