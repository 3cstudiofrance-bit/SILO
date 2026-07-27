import { Link } from "wouter";
import { CheckCircle, CreditCard, Loader2, Star } from "lucide-react";
import { useListTransactions } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SOCIAL_PACKS, formatEUR } from "@/lib/finance";

export default function ClientSubscriptions() {
  const { data: transactions = [], isLoading } = useListTransactions();
  const subscriptionPayments = transactions.filter(
    (transaction) => transaction.kind === "abonnement",
  );
  const confirmed = subscriptionPayments.filter(
    (transaction) => transaction.status === "confirmee",
  );
  const pending = subscriptionPayments.filter(
    (transaction) =>
      transaction.status === "en_attente_paiement" ||
      transaction.status === "echouee",
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Mes abonnements
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Packs mensuels sans engagement, établis sur devis.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Échéances enregistrées
              </h2>
              {pending.length > 0 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/transactions">
                    {pending.length} à régler
                  </Link>
                </Button>
              )}
            </div>
            {subscriptionPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                <CreditCard className="mb-3 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Aucun abonnement facturé
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                {subscriptionPayments.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <CreditCard className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {transaction.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Échéance du{" "}
                        {new Date(transaction.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {transaction.ttc != null
                          ? formatEUR(transaction.ttc)
                          : "—"}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          transaction.status === "confirmee"
                            ? "text-emerald-400"
                            : "text-amber-400",
                        )}
                      >
                        {transaction.status === "confirmee"
                          ? "Réglée"
                          : "À régler"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {confirmed.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {confirmed.length} échéance
                {confirmed.length > 1 ? "s" : ""} réglée
                {confirmed.length > 1 ? "s" : ""}. Chaque mois reste sans
                engagement.
              </p>
            )}
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Packs réseaux sociaux
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {SOCIAL_PACKS.map((pack) => {
              const highlight = pack.id === "business";
              return (
                <div
                  key={pack.id}
                  className={cn(
                    "flex flex-col gap-4 rounded-lg border p-5",
                    highlight
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card",
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {pack.name}
                      </p>
                      {highlight && (
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                      {formatEUR(pack.priceHT)}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        HT/mois
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatEUR(pack.priceTTC)} TTC/mois
                    </p>
                  </div>
                  <ul className="flex-1 space-y-1.5">
                    {pack.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button size="sm" asChild>
                    <Link href="/dashboard/demandes">Demander un devis</Link>
                  </Button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Minimum contractuel : 600 € HT par mois. Le périmètre final est
            défini avec votre conseiller avant toute demande de paiement.
          </p>
        </section>
      </div>
    </DashboardLayout>
  );
}
