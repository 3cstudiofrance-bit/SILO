import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListQuotesQueryKey,
  useListQuotes,
  useReserveQuote,
  useUpdateQuoteTreatment,
  type Quote,
  type QuoteTreatmentInput,
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  RUBRIQUES,
  rubriqueOf,
  isInFollowUp,
  isLate,
  needsRelance,
  WAIT_REASON_CONFIG,
  URGENCY_CONFIG,
  PROFILE_LABELS,
  SOURCE_LABELS,
  formatRelative,
  formatDateTime,
  type Dossier,
  type DossierEvent,
  type Rubrique,
  type WaitReason,
} from "@/lib/dossiers-data";
import { cn } from "@/lib/utils";
import {
  Phone,
  PhoneMissed,
  PhoneOff,
  Copy,
  CalendarClock,
  CheckCircle2,
  Lock,
  Clock,
  AlertTriangle,
  Inbox,
  User,
  MessageSquare,
  FileText,
  History,
  PauseCircle,
  PlayCircle,
  MapPin,
  Mail,
  Link2,
  ArrowUpRight,
  EyeOff,
  Loader2,
  RefreshCw,
} from "lucide-react";

let seq = 1000;
const newEvent = (
  type: DossierEvent["type"],
  title: string,
  description?: string,
  author = "Conseiller SILO",
  authorRole: DossierEvent["authorRole"] = "pm",
): DossierEvent => ({
  id: `ev-live-${++seq}`,
  date: new Date().toISOString(),
  type,
  title,
  description,
  author,
  authorRole,
});

const WAIT_BUTTONS: { reason: WaitReason; icon: React.ElementType }[] = [
  { reason: "escalade", icon: ArrowUpRight },
  { reason: "rdv_telephonique", icon: CalendarClock },
  { reason: "suivi", icon: EyeOff },
  { reason: "retour_client_48h", icon: User },
  { reason: "retour_agence_48h", icon: MessageSquare },
  { reason: "validation_admin", icon: CheckCircle2 },
  { reason: "fichier_client", icon: FileText },
  { reason: "correction_agence", icon: History },
];

const SERVICE_LABELS: Record<Quote["serviceType"], string> = {
  mariage: "Vidéo de mariage",
  clip: "Clip musical",
  corporate: "Film corporate",
  reseaux: "Contenus réseaux sociaux",
  autre: "Autre prestation audiovisuelle",
};

function quoteToDossier(quote: Quote, advisorName: string): Dossier {
  const nameParts = quote.clientName.trim().split(/\s+/);
  const firstName = nameParts.shift() || "Client";
  const lastName = nameParts.join(" ");
  const isTerminal = quote.status === "accepte" || quote.status === "refuse";
  const isAssigned = Boolean(quote.advisorUserId);
  const workflowStatus = isTerminal ? "closed" : quote.workflowStatus;
  const events: DossierEvent[] = [
    {
      id: `quote-${quote.id}-created`,
      date: quote.createdAt,
      author: "Système",
      authorRole: "system",
      title: "Demande reçue",
      description: "Demande envoyée depuis l’espace client SILO.",
      type: "created",
    },
  ];

  if (isAssigned) {
    events.push({
      id: `quote-${quote.id}-reserved`,
      date: quote.reservedAt || quote.updatedAt,
      author: advisorName,
      authorRole: "pm",
      title: "Dossier réservé",
      description: "Demande attribuée au conseiller connecté.",
      type: "reserved",
    });
  }
  if (quote.status === "envoye") {
    events.push({
      id: `quote-${quote.id}-sent`,
      date: quote.updatedAt,
      author: advisorName,
      authorRole: "pm",
      title: "Devis envoyé",
      type: "status",
    });
  }
  if (isTerminal) {
    events.push({
      id: `quote-${quote.id}-closed`,
      date: quote.updatedAt,
      author: "Système",
      authorRole: "system",
      title: quote.status === "accepte" ? "Devis accepté" : "Devis refusé",
      type: "closed",
    });
  }

  return {
    id: `Q-${quote.id}`,
    service: SERVICE_LABELS[quote.serviceType],
    clientProfile:
      quote.serviceType === "clip"
        ? "artiste"
        : quote.serviceType === "corporate" || quote.serviceType === "reseaux"
          ? "entreprise"
          : "particulier",
    firstName,
    lastName,
    phone: "Non renseigné",
    email: quote.clientEmail,
    city: "Non renseignée",
    need: [
      quote.details || "Besoin à qualifier avec le client.",
      quote.budget ? `Budget indicatif : ${quote.budget}` : null,
      quote.amount !== null && quote.amount !== undefined
        ? `Devis : ${quote.amount.toLocaleString("fr-FR")} EUR HT`
        : null,
    ]
      .filter(Boolean)
      .join("\n"),
    urgency: "normale",
    source: "site",
    status:
      workflowStatus === "closed"
        ? "cloture"
        : workflowStatus === "waiting"
          ? "en_attente"
          : workflowStatus === "follow_up"
            ? "suivi"
            : workflowStatus === "in_progress" || isAssigned
              ? "en_traitement"
              : "nouveau",
    createdAt: quote.createdAt,
    assignedPm: isAssigned ? advisorName : undefined,
    reservedAt: quote.reservedAt || (isAssigned ? quote.updatedAt : undefined),
    lastTreatedAt:
      quote.lastTreatedAt ||
      (quote.status === "envoye" ? quote.updatedAt : undefined),
    waitReason: quote.waitReason || undefined,
    waitUntil: quote.waitUntil || undefined,
    followUpUntil: quote.followUpUntil || undefined,
    closedAt: quote.closedAt || (isTerminal ? quote.updatedAt : undefined),
    events,
  };
}

export default function PMTreatmentCenter() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const {
    data: quotes,
    isLoading,
    isError,
    refetch,
  } = useListQuotes({
    query: {
      queryKey: getListQuotesQueryKey(),
      refetchOnWindowFocus: false,
    },
  });
  const reserveQuote = useReserveQuote();
  const updateQuoteTreatment = useUpdateQuoteTreatment();
  const advisorName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Conseiller SILO";
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [rubrique, setRubrique] = useState<Rubrique>("a_reserver");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (quotes) {
      setDossiers(quotes.map((quote) => quoteToDossier(quote, advisorName)));
    }
  }, [advisorName, quotes]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  const lists = useMemo(() => {
    const at = Date.now();
    return Object.fromEntries(
      RUBRIQUES.map((r) => [
        r.key,
        rubriqueOf(dossiers, r.key, advisorName, at),
      ]),
    ) as Record<Rubrique, Dossier[]>;
  }, [advisorName, dossiers]);

  const queue = lists[rubrique];
  const selected =
    dossiers.find((d) => d.id === selectedId) ?? queue[0] ?? null;

  const update = (id: string, fn: (d: Dossier) => Dossier) =>
    setDossiers((prev) => prev.map((d) => (d.id === id ? fn(d) : d)));

  // ── Actions ──

  const reserve = (d: Dossier) => {
    const quoteId = Number(d.id.replace(/^Q-/, ""));
    if (!Number.isSafeInteger(quoteId)) {
      showToast("Identifiant de demande invalide");
      return;
    }

    reserveQuote.mutate(
      { id: quoteId },
      {
        onSuccess: (quote) => {
          queryClient.setQueryData<Quote[]>(
            getListQuotesQueryKey(),
            (current = []) =>
              current.map((item) => (item.id === quote.id ? quote : item)),
          );
          update(d.id, (item) => ({
            ...item,
            status: "en_traitement",
            assignedPm: advisorName,
            reservedAt: quote.updatedAt,
            events: [
              ...item.events,
              newEvent(
                "reserved",
                "Dossier réservé",
                `Réservé par ${advisorName} — passé dans « Mes dossiers ».`,
                advisorName,
              ),
            ],
          }));
          setRubrique("mes_dossiers");
          setSelectedId(d.id);
          showToast(`Dossier ${d.id} réservé`);
          void queryClient.invalidateQueries({
            queryKey: getListQuotesQueryKey(),
          });
        },
        onError: (error) => {
          showToast(
            error instanceof Error ? error.message : "La réservation a échoué",
          );
          void queryClient.invalidateQueries({
            queryKey: getListQuotesQueryKey(),
          });
        },
      },
    );
  };

  const persistTreatment = (
    d: Dossier,
    data: QuoteTreatmentInput,
    apply: (item: Dossier, quote: Quote) => Dossier,
    successMessage: string,
  ) => {
    const quoteId = Number(d.id.replace(/^Q-/, ""));
    if (!Number.isSafeInteger(quoteId)) {
      showToast("Identifiant de demande invalide");
      return;
    }
    setSelectedId(d.id);
    updateQuoteTreatment.mutate(
      { id: quoteId, data },
      {
        onSuccess: (quote) => {
          queryClient.setQueryData<Quote[]>(
            getListQuotesQueryKey(),
            (current = []) =>
              current.map((item) => (item.id === quote.id ? quote : item)),
          );
          update(d.id, (item) => apply(item, quote));
          showToast(successMessage);
        },
        onError: (error) => {
          showToast(
            error instanceof Error
              ? error.message
              : "La mise à jour du dossier a échoué",
          );
          void queryClient.invalidateQueries({
            queryKey: getListQuotesQueryKey(),
          });
        },
      },
    );
  };

  const treat = (
    d: Dossier,
    type: "call" | "message",
    title: string,
    description?: string,
  ) => {
    const action: QuoteTreatmentInput["action"] =
      title === "Client rappelé"
        ? "client_called"
        : title === "Appel manqué"
          ? "missed_call"
          : type === "message"
            ? "message_sent"
            : "unreachable";
    persistTreatment(
      d,
      { action },
      (x, quote) => ({
        ...x,
        status: "en_traitement",
        lastTreatedAt: quote.lastTreatedAt || quote.updatedAt,
        unreadClientMessage: false,
        events: [...x.events, newEvent(type, title, description, advisorName)],
      }),
      title,
    );
  };

  const putOnWait = (d: Dossier, reason: WaitReason) => {
    const cfg = WAIT_REASON_CONFIG[reason];
    const until = new Date(
      Date.now() + cfg.delayHours * 3600_000,
    ).toISOString();
    persistTreatment(
      d,
      { action: "wait", waitReason: reason, waitUntil: until },
      (x, quote) => ({
        ...x,
        status: "en_attente",
        waitReason: reason,
        waitUntil: quote.waitUntil || until,
        lastTreatedAt: quote.lastTreatedAt || quote.updatedAt,
        events: [
          ...x.events,
          newEvent(
            "wait",
            `Mise en attente : ${cfg.label}`,
            `Prochain déclencheur : ${cfg.trigger}. Retour prévu ${formatDateTime(until)}.`,
            advisorName,
          ),
        ],
      }),
      `Dossier mis en attente — ${cfg.label}`,
    );
  };

  const reopen = (d: Dossier) => {
    persistTreatment(
      d,
      { action: "resume" },
      (x, quote) => ({
        ...x,
        status: "en_traitement",
        waitReason: undefined,
        waitUntil: undefined,
        lastTreatedAt: quote.lastTreatedAt || quote.updatedAt,
        events: [
          ...x.events,
          newEvent(
            "resume",
            "Dossier rouvert manuellement",
            "Sortie de l'état d'attente par le chef de projet.",
            advisorName,
          ),
        ],
      }),
      "Dossier rouvert",
    );
  };

  const close = (d: Dossier) => {
    persistTreatment(
      d,
      { action: "close" },
      (x, quote) => ({
        ...x,
        status: "cloture",
        closedAt: quote.closedAt || quote.updatedAt,
        waitReason: undefined,
        waitUntil: undefined,
        events: [
          ...x.events,
          newEvent("closed", "Dossier clôturé", undefined, advisorName),
        ],
      }),
      `Dossier ${d.id} clôturé`,
    );
  };

  const startFollowUp = (d: Dossier) => {
    const until = new Date(Date.now() + 72 * 3600_000).toISOString();
    persistTreatment(
      d,
      { action: "follow_up", followUpUntil: until },
      (x, quote) => ({
        ...x,
        status: "suivi",
        followUpUntil: quote.followUpUntil || until,
        lastTreatedAt: quote.lastTreatedAt || quote.updatedAt,
        events: [
          ...x.events,
          newEvent(
            "status",
            "Passage en suivi (3 jours)",
            "Le dossier reste dans « Mes dossiers », atténué, jusqu'à la fin du suivi.",
            advisorName,
          ),
        ],
      }),
      "Suivi de 3 jours démarré",
    );
  };

  const copyPhone = (d: Dossier) => {
    void navigator.clipboard?.writeText(d.phone).catch(() => undefined);
    showToast(`Numéro copié : ${d.phone}`);
  };

  const isMine = selected?.assignedPm === advisorName;
  // Un dossier « nouveau » doit d'abord être réservé avant tout traitement.
  const canAct =
    selected && !["cloture", "archive", "nouveau"].includes(selected.status);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">
          Centre de traitement
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestion des dossiers entrants — connecté en tant que{" "}
          <span className="text-foreground font-medium">{advisorName}</span>
        </p>
      </div>

      {isLoading && (
        <div className="mb-5 flex items-center gap-2 border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des demandes…
        </div>
      )}
      {isError && (
        <div className="mb-5 flex items-center justify-between gap-4 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-400">
          <span>Les demandes n’ont pas pu être chargées.</span>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 border border-red-400/40 px-2.5 py-1.5 font-medium hover:bg-red-400/10"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Réessayer
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-[300px_1fr] gap-5 items-start">
        {/* ── Colonne gauche : rubriques + file ── */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-2">
            {RUBRIQUES.map((r) => {
              const count = lists[r.key].length;
              const active = rubrique === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => {
                    setRubrique(r.key);
                    setSelectedId(null);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                    active
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {r.key === "a_reserver" && (
                      <Inbox className="w-3.5 h-3.5" />
                    )}
                    {r.key === "urgents" && (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    {r.key === "en_retard" && <Clock className="w-3.5 h-3.5" />}
                    {r.label}
                  </span>
                  <span
                    className={cn(
                      "text-xs rounded-full px-1.5 py-0.5 min-w-[1.5rem] text-center",
                      count > 0 &&
                        (r.key === "urgents" || r.key === "en_retard")
                        ? "bg-red-400/15 text-red-400"
                        : count > 0
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground/50",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* File de dossiers */}
          <div className="space-y-2">
            {queue.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Aucun dossier dans cette rubrique.
              </div>
            )}
            {queue.map((d) => {
              const dimmed = isInFollowUp(d) || d.status === "en_attente";
              const late = isLate(d);
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className={cn(
                    "w-full text-left rounded-xl border p-3 transition-all",
                    selected?.id === d.id
                      ? "border-primary/50 bg-primary/5"
                      : "border-border bg-card hover:border-primary/30",
                    dimmed && "opacity-50 blur-[0.4px] hover:opacity-80",
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {d.id}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {d.unreadClientMessage && (
                        <span
                          className="w-2 h-2 rounded-full bg-primary animate-pulse"
                          title="Nouveau message client"
                        />
                      )}
                      {late && <Clock className="w-3 h-3 text-red-400" />}
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full border",
                          URGENCY_CONFIG[d.urgency].bg,
                          URGENCY_CONFIG[d.urgency].color,
                        )}
                      >
                        {URGENCY_CONFIG[d.urgency].label}
                      </span>
                    </span>
                  </div>
                  <p className="text-sm font-medium line-clamp-1">
                    {d.service}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {d.firstName} {d.lastName} · {SOURCE_LABELS[d.source]}
                  </p>
                  {d.status === "en_attente" && d.waitReason && (
                    <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                      <PauseCircle className="w-3 h-3" />{" "}
                      {WAIT_REASON_CONFIG[d.waitReason].label}
                      {d.waitUntil && (
                        <span className="text-muted-foreground">
                          · retour {formatRelative(d.waitUntil)}
                        </span>
                      )}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground/70 mt-1">
                    Reçu {formatRelative(d.createdAt)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Fiche dossier ── */}
        {selected ? (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Actions rapides en haut */}
            <div className="border-b border-border px-5 py-3 flex items-center gap-2 flex-wrap bg-secondary/40">
              {selected.status === "nouveau" && (
                <button
                  onClick={() => reserve(selected)}
                  disabled={reserveQuote.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:cursor-wait disabled:opacity-60"
                >
                  {reserveQuote.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  {reserveQuote.isPending
                    ? "Réservation…"
                    : "Réserver ce dossier"}
                </button>
              )}
              {canAct && (
                <>
                  <button
                    onClick={() => copyPhone(selected)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copier le numéro
                  </button>
                  <button
                    onClick={() =>
                      treat(
                        selected,
                        "call",
                        "Client rappelé",
                        "Appel sortant effectué.",
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> Rappelé
                  </button>
                  <button
                    onClick={() =>
                      treat(
                        selected,
                        "call",
                        "Appel manqué",
                        "Le client n'a pas répondu.",
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
                  >
                    <PhoneMissed className="w-3.5 h-3.5" /> Appel manqué
                  </button>
                  <button
                    onClick={() =>
                      treat(
                        selected,
                        "call",
                        "Client injoignable",
                        "Plusieurs tentatives sans réponse.",
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
                  >
                    <PhoneOff className="w-3.5 h-3.5" /> Injoignable
                  </button>
                  <button
                    onClick={() => putOnWait(selected, "rdv_telephonique")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
                  >
                    <CalendarClock className="w-3.5 h-3.5" /> Programmer rappel
                  </button>
                  {isMine && selected.status !== "suivi" && (
                    <button
                      onClick={() => startFollowUp(selected)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
                    >
                      <EyeOff className="w-3.5 h-3.5" /> Passer en suivi
                    </button>
                  )}
                  <button
                    onClick={() => close(selected)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-400/40 text-emerald-400 text-sm hover:bg-emerald-400/10 transition-colors ml-auto"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Clôturer
                  </button>
                </>
              )}
              {selected.status === "en_attente" && (
                <button
                  onClick={() => reopen(selected)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 text-primary text-sm hover:bg-primary/10 transition-colors"
                >
                  <PlayCircle className="w-3.5 h-3.5" /> Rouvrir le dossier
                </button>
              )}
            </div>

            {/* Bandeau attente */}
            {selected.status === "en_attente" && selected.waitReason && (
              <div
                className={cn(
                  "px-5 py-3 border-b border-border text-sm flex items-center gap-2 flex-wrap",
                  isLate(selected)
                    ? "bg-red-400/10 text-red-400"
                    : "bg-amber-400/10 text-amber-400",
                )}
              >
                <PauseCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">
                  {WAIT_REASON_CONFIG[selected.waitReason].label}
                </span>
                <span className="text-muted-foreground">
                  Déclencheur :{" "}
                  {WAIT_REASON_CONFIG[selected.waitReason].trigger}
                  {selected.waitUntil && (
                    <>
                      {" "}
                      · Retour prévu {formatDateTime(selected.waitUntil)} (
                      {formatRelative(selected.waitUntil)})
                    </>
                  )}
                </span>
                {isLate(selected) && (
                  <span className="font-medium">— EN RETARD</span>
                )}
              </div>
            )}
            {needsRelance(selected) && selected.status !== "en_attente" && (
              <div className="px-5 py-3 border-b border-border text-sm bg-orange-400/10 text-orange-400 flex items-center gap-2">
                <Clock className="w-4 h-4" /> À relancer — dernier traitement{" "}
                {selected.lastTreatedAt
                  ? formatRelative(selected.lastTreatedAt)
                  : "—"}{" "}
                (règle des 24h)
              </div>
            )}
            {selected.status === "suivi" && selected.followUpUntil && (
              <div className="px-5 py-3 border-b border-border text-sm bg-secondary text-muted-foreground flex items-center gap-2">
                <EyeOff className="w-4 h-4" /> Suivi en cours jusqu'au{" "}
                {formatDateTime(selected.followUpUntil)} — le dossier est
                atténué dans « Mes dossiers ». Un nouveau message client le
                remonte dans la file active.
              </div>
            )}

            <div className="p-5 md:p-6">
              {/* En-tête fiche */}
              <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm text-muted-foreground">
                      {selected.id}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full border",
                        URGENCY_CONFIG[selected.urgency].bg,
                        URGENCY_CONFIG[selected.urgency].color,
                      )}
                    >
                      {URGENCY_CONFIG[selected.urgency].label}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
                      {PROFILE_LABELS[selected.clientProfile]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
                      {SOURCE_LABELS[selected.source]}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold">{selected.service}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selected.firstName} {selected.lastName}
                    {selected.assignedPm && (
                      <>
                        {" "}
                        · attribué à{" "}
                        <span className="text-foreground">
                          {selected.assignedPm}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Coordonnées + besoin */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-border p-4 space-y-2 text-sm">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                    Coordonnées
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    {selected.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    {selected.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    {selected.city}
                  </p>
                  {selected.attachment && (
                    <p className="flex items-center gap-2">
                      <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <a
                        href={selected.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        Fichier / lien joint
                      </a>
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-border p-4 text-sm">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                    Besoin résumé
                  </p>
                  <p className="leading-relaxed text-muted-foreground">
                    {selected.need}
                  </p>
                </div>
              </div>

              {/* Boutons d'attente */}
              {canAct && selected.status !== "nouveau" && (
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                    Mettre en attente
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {WAIT_BUTTONS.map(({ reason, icon: Icon }) => (
                      <button
                        key={reason}
                        onClick={() => putOnWait(selected, reason)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors",
                          selected.waitReason === reason
                            ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
                            : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary",
                        )}
                      >
                        <Icon className="w-3 h-3" />{" "}
                        {WAIT_REASON_CONFIG[reason].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Historique du dossier
                </p>
                <div className="space-y-0">
                  {[...selected.events].reverse().map((e, i, arr) => (
                    <div key={e.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0",
                            e.type === "closed"
                              ? "bg-emerald-400"
                              : e.type === "wait"
                                ? "bg-amber-400"
                                : e.type === "escalade"
                                  ? "bg-red-400"
                                  : e.type === "message" &&
                                      e.authorRole === "client"
                                    ? "bg-primary"
                                    : "bg-border",
                          )}
                        />
                        {i < arr.length - 1 && (
                          <div className="w-px flex-1 bg-border my-1" />
                        )}
                      </div>
                      <div className="pb-4 min-w-0">
                        <p className="text-sm font-medium">{e.title}</p>
                        {e.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {e.description}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                          {formatDateTime(e.date)} · {e.author}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
            Sélectionnez un dossier dans la file de gauche.
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-foreground text-background text-sm px-4 py-2.5 shadow-xl animate-fade-up">
          {toast}
        </div>
      )}
    </DashboardLayout>
  );
}
