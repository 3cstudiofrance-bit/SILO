import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Euro,
  PiggyBank,
  Percent,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Loader2,
  Plus,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/shared/StatCard";
import {
  formatEUR,
  SPLIT,
  frpStatusLabel,
  QUOTE_FLOOR_PONCTUEL_HT,
  QUOTE_FLOOR_ABONNEMENT_HT,
  computeOperationalAllocation,
  meetsQuoteFloor,
} from "@/lib/finance";
import {
  useListTransactions,
  useListFrpAccounts,
  useListFrpMovements,
  useCreateTransaction,
  useListProjects,
  useListPartnerMissions,
  getListTransactionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function extractServerError(e: unknown): string {
  if (e && typeof e === "object" && "data" in e) {
    const data = (e as { data?: unknown }).data;
    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
    ) {
      return (data as { error: string }).error;
    }
  }
  return e instanceof Error ? e.message : "Erreur inconnue";
}

const NO_PROJECT = "__none__";
const PAYMENT_STATUS = {
  en_attente_paiement: {
    label: "À régler",
    className: "bg-amber-500/10 text-amber-400",
  },
  confirmee: {
    label: "Payée",
    className: "bg-emerald-500/10 text-emerald-400",
  },
  echouee: {
    label: "Échec",
    className: "bg-red-500/10 text-red-400",
  },
  annulee: {
    label: "Annulée",
    className: "bg-muted text-muted-foreground",
  },
  remboursee: {
    label: "Remboursée",
    className: "bg-blue-500/10 text-blue-400",
  },
} as const;

function CreateTransactionDialog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: projects } = useListProjects();
  const { data: missions } = useListPartnerMissions();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [agencyChoice, setAgencyChoice] = useState("");
  const [kind, setKind] = useState<"ponctuel" | "abonnement">("ponctuel");
  const [amountHt, setAmountHt] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [projectChoice, setProjectChoice] = useState<string>(NO_PROJECT);

  const createTx = useCreateTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListTransactionsQueryKey(),
        });
        toast({
          title: "Demande de paiement créée",
          description:
            "Le client peut maintenant régler le montant TTC. Les commissions seront comptabilisées après confirmation Stripe.",
        });
        setOpen(false);
        setTitle("");
        setAmountHt("");
        setAgencyChoice("");
        setProjectChoice(NO_PROJECT);
        setServerError(null);
      },
      onError: (e: unknown) => {
        const msg = extractServerError(e);
        setServerError(msg);
        toast({
          title: "Refusé par le serveur",
          description: msg,
          variant: "destructive",
        });
      },
    },
  });

  const floor =
    kind === "ponctuel" ? QUOTE_FLOOR_PONCTUEL_HT : QUOTE_FLOOR_ABONNEMENT_HT;
  const amount = parseFloat(amountHt.replace(",", "."));
  const amountValid = !Number.isNaN(amount) && amount > 0;
  const belowFloor = amountValid && !meetsQuoteFloor(amount, kind);
  const preview =
    amountValid && !belowFloor ? computeOperationalAllocation(amount) : null;

  const projectId = projectChoice === NO_PROJECT ? null : Number(projectChoice);
  const selectedProject = (projects ?? []).find((p) => p.id === projectId);
  const projectMissions = (missions ?? []).filter(
    (mission) => mission.projectId === projectId && mission.status !== "refuse",
  );

  const canSubmit =
    title.trim().length > 0 &&
    projectId !== null &&
    Boolean(selectedProject?.clientUserId) &&
    agencyChoice.length > 0 &&
    amountValid &&
    !belowFloor &&
    !createTx.isPending;

  const submit = () => {
    if (!canSubmit || projectId === null) return;
    setServerError(null);
    createTx.mutate({
      data: {
        projectId,
        title: title.trim(),
        agencyId: agencyChoice,
        kind,
        amountHt: amount,
        date,
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setServerError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Nouvelle transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer une transaction</DialogTitle>
          <DialogDescription>
            Prépare une demande de paiement client. La répartition 70/20/10 sera
            comptabilisée uniquement après confirmation Stripe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tx-title">Titre</Label>
            <Input
              id="tx-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Film corporate — Acme SAS"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Projet</Label>
            <Select
              value={projectChoice}
              onValueChange={(value) => {
                setProjectChoice(value);
                setAgencyChoice("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROJECT}>Choisir un projet</SelectItem>
                {(projects ?? []).map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProject && !selectedProject.clientUserId && (
              <p className="text-xs text-amber-400">
                Le compte client doit être lié à ce projet avant de demander le
                paiement.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Partenaire attributaire</Label>
            <Select
              value={agencyChoice || undefined}
              onValueChange={setAgencyChoice}
              disabled={!selectedProject || projectMissions.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir une mission partenaire" />
              </SelectTrigger>
              <SelectContent>
                {projectMissions.map((mission) => (
                  <SelectItem key={mission.id} value={mission.partnerId}>
                    {mission.partnerName} · {mission.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProject && projectMissions.length === 0 && (
              <p className="text-xs text-amber-400">
                Une mission partenaire active doit d’abord être attribuée à ce
                projet.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={kind}
                onValueChange={(v) => setKind(v as "ponctuel" | "abonnement")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ponctuel">
                    Ponctuel (≥ {QUOTE_FLOOR_PONCTUEL_HT} € HT)
                  </SelectItem>
                  <SelectItem value="abonnement">
                    Abonnement (≥ {QUOTE_FLOOR_ABONNEMENT_HT} € HT/mois)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tx-amount">Montant HT (€)</Label>
              <Input
                id="tx-amount"
                inputMode="decimal"
                value={amountHt}
                onChange={(e) => setAmountHt(e.target.value)}
                placeholder={`≥ ${floor}`}
                aria-invalid={belowFloor}
              />
            </div>
          </div>

          {belowFloor && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">
                Montant sous le plancher : un devis {kind} doit être ≥ {floor} €
                HT{kind === "abonnement" ? "/mois" : ""}.
              </p>
            </div>
          )}

          {preview && (
            <div className="p-3 rounded-lg bg-card border border-border text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">
                Aperçu de la répartition (recalculée côté serveur)
              </p>
              <p>
                Agence 70 % :{" "}
                <span className="text-emerald-400 font-semibold">
                  {formatEUR(preview.partAgence)}
                </span>{" "}
                · Silo 20 % :{" "}
                <span className="text-primary font-semibold">
                  {formatEUR(preview.partSilo)}
                </span>{" "}
                · FRP 10 % :{" "}
                <span className="text-violet-400 font-semibold">
                  {formatEUR(preview.partFrp)}
                </span>{" "}
                · TTC : {formatEUR(preview.ttc)}
              </p>
              <p>
                PSP estimé : {formatEUR(preview.fraisPspTotal)} · réserve
                incidents : {formatEUR(preview.reserveIncidents)} · contribution
                SILO après variables :{" "}
                <span className="font-semibold text-foreground">
                  {formatEUR(preview.contributionSiloApresVariables)}
                </span>
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="tx-date">Date d’émission</Label>
            <Input
              id="tx-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          {serverError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{serverError}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={createTx.isPending}
          >
            Annuler
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {createTx.isPending && (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            )}
            Préparer le paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminFinance() {
  // Données servies par l'API : la répartition 70/20/10 est calculée et stockée côté serveur.
  const { data: transactions, isLoading: txLoading } = useListTransactions();
  const { data: frpAccounts, isLoading: accLoading } = useListFrpAccounts();
  const { data: frpMovements, isLoading: mvLoading } = useListFrpMovements();

  const allTransactions = transactions ?? [];
  const confirmedTransactions = allTransactions.filter(
    (transaction) => transaction.status === "confirmee",
  );
  const totals = confirmedTransactions.reduce(
    (acc, t) => ({
      ht: acc.ht + (t.amountHt ?? 0),
      agence: acc.agence + (t.partAgence ?? 0),
      agenceNet: acc.agenceNet + (t.partAgenceApresPsp ?? 0),
      silo: acc.silo + (t.partSilo ?? 0),
      siloNet: acc.siloNet + (t.contributionSiloApresVariables ?? 0),
      frp: acc.frp + (t.partFrp ?? 0),
      psp: acc.psp + (t.fraisPspTotal ?? 0),
      reserve: acc.reserve + (t.reserveIncidents ?? 0),
      advisor: acc.advisor + (t.primeConseiller ?? 0),
    }),
    {
      ht: 0,
      agence: 0,
      agenceNet: 0,
      silo: 0,
      siloNet: 0,
      frp: 0,
      psp: 0,
      reserve: 0,
      advisor: 0,
    },
  );
  const accounts = frpAccounts ?? [];
  const movements = frpMovements ?? [];
  const frpTotal = accounts.reduce((s, a) => s + a.balance, 0);
  const loading = txLoading || accLoading || mvLoading;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Finance & commissions
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Répartition {SPLIT.agence * 100} % agence / {SPLIT.silo * 100} %
              Silo / {SPLIT.frp * 100} % FRP, calculée sur le HT côté serveur.
            </p>
          </div>
          <CreateTransactionDialog />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Volume facturé HT"
            value={formatEUR(totals.ht)}
            icon={Euro}
            description="Transactions confirmées"
          />
          <StatCard
            label="Contribution SILO nette"
            value={formatEUR(totals.siloNet)}
            icon={Percent}
            description={`${formatEUR(totals.silo)} brut · ${formatEUR(totals.reserve)} en réserve`}
          />
          <StatCard
            label="Partenaires après PSP"
            value={formatEUR(totals.agenceNet)}
            icon={Building2}
            description={`${formatEUR(totals.agence)} brut · ${formatEUR(totals.psp)} PSP total`}
          />
          <StatCard
            label="FRP global (10 %)"
            value={formatEUR(frpTotal)}
            icon={PiggyBank}
            description="Soldes cumulés"
          />
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement des données
            financières…
          </div>
        )}

        {/* Répartition par transaction */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Demandes de paiement et répartition 70/20/10 (sur HT)
          </h2>
          <div className="rounded-xl border border-border overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Transaction
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Statut
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-emerald-400">
                    Partenaire
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-primary">
                    SILO
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-violet-400">
                    FRP 10 %
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Hypothèses
                  </th>
                </tr>
              </thead>
              <tbody>
                {allTransactions.length === 0 && !txLoading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-sm text-muted-foreground"
                    >
                      Aucune transaction enregistrée.
                    </td>
                  </tr>
                )}
                {allTransactions.map((t, i) => {
                  const paymentStatus = PAYMENT_STATUS[t.status];
                  return (
                    <tr
                      key={t.id}
                      className={cn(
                        "hover:bg-card/50 transition-colors",
                        i < allTransactions.length - 1 &&
                          "border-b border-border",
                      )}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{t.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.agencyName} ·{" "}
                          {new Date(t.date).toLocaleDateString("fr-FR")}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                            paymentStatus.className,
                          )}
                        >
                          {paymentStatus.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm font-semibold">
                          {t.amountHt != null ? formatEUR(t.amountHt) : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.ttc != null ? `${formatEUR(t.ttc)} TTC` : "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm text-emerald-400">
                          {t.partAgence != null ? formatEUR(t.partAgence) : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.partAgenceApresPsp != null
                            ? `${formatEUR(t.partAgenceApresPsp)} net`
                            : "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm text-primary">
                          {t.partSilo != null ? formatEUR(t.partSilo) : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.contributionSiloApresVariables != null
                            ? `${formatEUR(t.contributionSiloApresVariables)} net`
                            : "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-violet-400">
                        {t.partFrp != null ? formatEUR(t.partFrp) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-xs">
                          {t.fraisPspTotal != null
                            ? `${formatEUR(t.fraisPspTotal)} PSP`
                            : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.reserveIncidents != null
                            ? `${formatEUR(t.reserveIncidents)} réserve`
                            : "—"}
                        </p>
                        {t.primeConseiller != null && t.primeConseiller > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {formatEUR(t.primeConseiller)} conseiller
                          </p>
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
              Visibilité appliquée côté serveur : le client ne voit que le total
              ; le partenaire voit sa part brute, ses frais PSP et son net ; la
              répartition complète reste réservée à l'Admin et au conseiller
              habilité.
            </p>
          </div>
        </section>

        {/* Soldes FRP */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Soldes FRP par agence
          </h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Agence
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Transactions {new Date().getFullYear()}
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                    Décision
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Solde FRP
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 && !accLoading && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-sm text-muted-foreground"
                    >
                      Aucun compte FRP pour le moment.
                    </td>
                  </tr>
                )}
                {accounts.map((a, i) => {
                  const st = frpStatusLabel(a.transactionsThisYear);
                  return (
                    <tr
                      key={a.agencyId}
                      className={cn(
                        "hover:bg-card/50 transition-colors",
                        i < accounts.length - 1 && "border-b border-border",
                      )}
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {a.agencyName}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {a.transactionsThisYear}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            st.eligible ? "text-emerald-400" : "text-amber-400",
                          )}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold">
                        {formatEUR(a.balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Mouvements FRP */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mouvements FRP
          </h2>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            {movements.length === 0 && !mvLoading && (
              <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                Aucun mouvement FRP pour le moment.
              </p>
            )}
            {movements.map((mv) => (
              <div key={mv.id} className="flex items-center gap-4 px-5 py-3.5">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    mv.amount >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
                  )}
                >
                  {mv.amount >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {mv.agencyName} — {mv.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {mv.projectTitle ? `${mv.projectTitle} · ` : ""}
                    {new Date(mv.date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <p
                  className={cn(
                    "text-sm font-bold shrink-0",
                    mv.amount >= 0 ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {mv.amount >= 0 ? "+" : ""}
                  {formatEUR(mv.amount)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
