import { PartnerLayout } from "./PartnerLayout";
import { Euro, PiggyBank, TrendingUp, Info, ArrowDownRight, ArrowUpRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/shared/StatCard";
import { formatEUR, frpStatusLabel } from "@/lib/finance";
import { useListTransactions, useListFrpAccounts, useListFrpMovements } from "@workspace/api-client-react";

export default function PartnerFinance() {
  // L'API ne renvoie au partenaire que sa part brute, ses frais PSP et son net.
  const { data: transactions, isLoading: txLoading } = useListTransactions();
  const { data: accounts, isLoading: accLoading } = useListFrpAccounts();
  const { data: movements, isLoading: mvLoading } = useListFrpMovements();

  const myTxs = (transactions ?? []).filter(t => t.status === "confirmee");
  const totalBrut = myTxs.reduce((s, t) => s + (t.partAgence ?? 0), 0);
  const totalPsp = myTxs.reduce((s, t) => s + (t.fraisPspAgence ?? 0), 0);
  const totalNet = myTxs.reduce(
    (s, t) => s + (t.partAgenceApresPsp ?? 0),
    0,
  );
  const account = (accounts ?? [])[0];
  const frpStatus = account ? frpStatusLabel(account.transactionsThisYear) : null;
  const myMovements = movements ?? [];
  const loading = txLoading || accLoading || mvLoading;

  return (
    <PartnerLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rémunération & FRP</h1>
          <p className="text-sm text-muted-foreground mt-1">Votre rémunération et votre Fonds de Réinvestissement Partenaire.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Rémunération nette" value={formatEUR(totalNet)} icon={Euro} description={`${formatEUR(totalBrut)} brut · ${formatEUR(totalPsp)} de frais PSP`} />
          <StatCard label="Solde FRP" value={account ? formatEUR(account.balance) : "—"} icon={PiggyBank} description="Fonds de réinvestissement" />
          <StatCard label={`Transactions ${new Date().getFullYear()}`} value={account?.transactionsThisYear ?? 0} icon={TrendingUp} description="Sur l'année en cours" />
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
          </div>
        )}

        {/* Rémunération par transaction */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rémunération par transaction</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Prestation</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Brut</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Frais PSP</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Net</th>
                </tr>
              </thead>
              <tbody>
                {myTxs.length === 0 && !txLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">Aucune transaction pour le moment.</td>
                  </tr>
                )}
                {myTxs.map((t, i) => (
                  <tr key={t.id} className={cn("hover:bg-card/50 transition-colors", i < myTxs.length - 1 && "border-b border-border")}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.kind === "abonnement" ? "Abonnement" : "Prestation ponctuelle"}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-right text-sm">{t.partAgence != null ? formatEUR(t.partAgence) : "—"}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-right text-sm text-muted-foreground">{t.fraisPspAgence != null ? formatEUR(t.fraisPspAgence) : "—"}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold">{t.partAgenceApresPsp != null ? formatEUR(t.partAgenceApresPsp) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-400/5 border border-blue-400/20">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Les montants affichés détaillent votre part brute, les frais PSP qui vous sont imputés et votre net. Les conditions commerciales entre SILO et le client restent confidentielles.
            </p>
          </div>
        </section>

        {/* FRP */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fonds de Réinvestissement Partenaire (FRP)</h2>
          {frpStatus && (
            <div className={cn(
              "flex items-start gap-3 p-4 rounded-xl border",
              frpStatus.eligible ? "bg-emerald-400/5 border-emerald-400/20" : "bg-amber-400/5 border-amber-400/20"
            )}>
              <PiggyBank className={cn("w-4 h-4 shrink-0 mt-0.5", frpStatus.eligible ? "text-emerald-400" : "text-amber-400")} />
              <div>
                <p className={cn("text-sm font-medium", frpStatus.eligible ? "text-emerald-400" : "text-amber-400")}>{frpStatus.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {frpStatus.detail}. Le calendrier et le seuil définitifs seront appliqués après validation juridique, comptable et direction.
                </p>
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            {myMovements.length === 0 && !mvLoading && (
              <p className="px-5 py-6 text-center text-sm text-muted-foreground">Aucun mouvement FRP pour le moment.</p>
            )}
            {myMovements.map(mv => (
              <div key={mv.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", mv.amount >= 0 ? "bg-emerald-500/10" : "bg-red-500/10")}>
                  {mv.amount >= 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{mv.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{mv.projectTitle ? `${mv.projectTitle} · ` : ""}{new Date(mv.date).toLocaleDateString("fr-FR")}</p>
                </div>
                <p className={cn("text-sm font-bold shrink-0", mv.amount >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {mv.amount >= 0 ? "+" : ""}{formatEUR(mv.amount)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PartnerLayout>
  );
}
