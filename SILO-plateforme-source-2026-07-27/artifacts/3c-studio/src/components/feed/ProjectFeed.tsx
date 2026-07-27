/**
 * ProjectFeed — feed chronologique unique d'un projet, filtré par rôle.
 *
 * Les entrées viennent du serveur (API /feed/{projectId}) : la matrice de
 * visibilité est appliquée côté API, le client ne reçoit jamais les éléments
 * qui ne le concernent pas. Les messages utilisent la même API canonique afin
 * qu'une seule matrice d'autorisation s'applique à tout le projet.
 */
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListFeedEntries,
  useCreateFeedEntry,
  getListFeedEntriesQueryKey,
} from "@workspace/api-client-react";
import {
  MessageSquare,
  Mic,
  Paperclip,
  CalendarClock,
  StickyNote,
  Lock,
  AlertTriangle,
  ShieldAlert,
  Star,
  Phone,
  CheckCircle2,
  Send,
  FileVideo,
  FileImage,
  FileAudio,
  FileText,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FeedEntry,
  FeedEntryType,
  FeedRole,
  MessageChannel,
  ENTRY_TYPE_LABELS,
  CHANNEL_LABELS,
  seesEvaluationSummaryOnly,
} from "@/lib/feed-data";
import { useProjectCommStatus } from "@/lib/comm-settings";
import { useToast } from "@/hooks/use-toast";

// ── HELPERS D'AFFICHAGE ────────────────────────────────────────

const TYPE_ICONS: Record<FeedEntryType, React.ElementType> = {
  message: MessageSquare,
  audio: Mic,
  fichier: Paperclip,
  evenement: CalendarClock,
  note_suivi: StickyNote,
  note_sensible: Lock,
  escalade_agence_pm: AlertTriangle,
  escalade_pm_admin: ShieldAlert,
  evaluation: Star,
  score: Star,
  appel: Phone,
  validation: CheckCircle2,
};

const TYPE_STYLES: Record<FeedEntryType, string> = {
  message: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  audio: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  fichier: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  evenement: "text-muted-foreground bg-secondary border-border",
  note_suivi: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  note_sensible: "text-orange-400 bg-orange-500/10 border-orange-500/25",
  escalade_agence_pm: "text-red-400 bg-red-500/10 border-red-500/20",
  escalade_pm_admin: "text-red-400 bg-red-500/10 border-red-500/25",
  evaluation: "text-primary bg-primary/10 border-primary/20",
  score: "text-primary bg-primary/10 border-primary/20",
  appel: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  validation: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const ROLE_LABELS: Record<FeedRole, string> = {
  client: "Client",
  pm: "Chef de projet",
  agency: "Agence",
  admin: "Admin",
};

const ATTACH_ICONS = {
  video: FileVideo,
  image: FileImage,
  audio: FileAudio,
  document: FileText,
} as const;

const STATUS_BADGES: Record<string, string> = {
  ouverte: "bg-red-500/15 text-red-400 border-red-500/25",
  en_cours: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  resolue: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
};

const STATUS_LABELS: Record<string, string> = {
  ouverte: "Ouverte",
  en_cours: "En cours",
  resolue: "Résolue",
  interne: "Interne",
  sensible: "Sensible",
  validé: "Validé",
  transmis: "Transmis",
  effectué: "Effectué",
  créé: "Créé",
  production: "Production",
  abonnement: "Abonnement",
};

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m} min ${s.toString().padStart(2, "0")}` : `${s} s`;
}

function fmtDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - day.getTime()) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── FILTRES ────────────────────────────────────────────────────

type FilterKey = "tous" | "messages" | "fichiers" | "interne" | "evenements";

const FILTER_DEFS: {
  key: FilterKey;
  label: string;
  types: FeedEntryType[] | null;
  internalOnly?: boolean;
}[] = [
  { key: "tous", label: "Tout", types: null },
  {
    key: "messages",
    label: "Messages & appels",
    types: ["message", "audio", "appel"],
  },
  {
    key: "fichiers",
    label: "Fichiers & validations",
    types: ["fichier", "validation"],
  },
  {
    key: "interne",
    label: "Notes & escalades",
    types: [
      "note_suivi",
      "note_sensible",
      "escalade_agence_pm",
      "escalade_pm_admin",
    ],
    internalOnly: true,
  },
  {
    key: "evenements",
    label: "Événements & scores",
    types: ["evenement", "evaluation", "score"],
  },
];

function VoiceMessageSummary({ durationSec }: { durationSec?: number }) {
  return (
    <div className="mt-2 flex items-center gap-3 rounded-lg bg-secondary border border-border px-3 py-2 w-full max-w-xs">
      <Mic className="h-4 w-4 flex-shrink-0 text-primary" />
      <span className="flex-1 text-xs text-muted-foreground">
        Message vocal enregistré
      </span>
      <span className="text-[10px] text-muted-foreground flex-shrink-0">
        {durationSec ? fmtDuration(durationSec) : "—"}
      </span>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "w-3.5 h-3.5",
            i <= Math.round(value)
              ? "text-primary fill-primary"
              : "text-muted-foreground/40",
          )}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-foreground">
        {value.toFixed(1).replace(".", ",")}/5
      </span>
    </span>
  );
}

// ── CARTE D'ENTRÉE ─────────────────────────────────────────────

function FeedEntryCard({
  entry,
  viewerRole,
}: {
  entry: FeedEntry;
  viewerRole: FeedRole;
}) {
  const Icon = TYPE_ICONS[entry.type as FeedEntryType];
  const isMsgLike =
    entry.type === "message" ||
    entry.type === "audio" ||
    entry.type === "appel";

  const authorLabel =
    viewerRole === "client" && entry.authorRole === "pm" && isMsgLike
      ? `${entry.authorName}, votre conseiller SILO`
      : entry.authorName;

  const evalSummaryOnly =
    entry.type === "evaluation" && seesEvaluationSummaryOnly(viewerRole);

  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5",
          TYPE_STYLES[entry.type as FeedEntryType],
        )}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0 rounded-xl bg-card border border-border p-3.5">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs font-semibold text-foreground">
            {authorLabel}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
            {ROLE_LABELS[entry.authorRole as FeedRole]}
          </span>
          <span className="text-[10px] text-muted-foreground/70">
            {ENTRY_TYPE_LABELS[entry.type as FeedEntryType]}
          </span>
          {entry.channel && (
            <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">
              · {CHANNEL_LABELS[entry.channel as MessageChannel]}
            </span>
          )}
          {entry.status && (
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
                STATUS_BADGES[entry.status] ??
                  "bg-secondary text-muted-foreground border-border",
              )}
            >
              {STATUS_LABELS[entry.status] ?? entry.status}
            </span>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground/60 flex-shrink-0">
            {fmtTime(entry.createdAt)}
          </span>
        </div>

        {entry.recipient && (
          <p className="text-[10px] text-muted-foreground/70 mb-1">
            À : {entry.recipient}
          </p>
        )}

        {evalSummaryOnly ? (
          <p className="text-sm text-muted-foreground italic">
            Évaluation client reçue. Le détail est réservé au suivi qualité
            SILO.
          </p>
        ) : (
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {entry.content}
          </p>
        )}

        {entry.type === "audio" && (
          <VoiceMessageSummary durationSec={entry.durationSec ?? undefined} />
        )}

        {entry.type === "appel" && entry.durationSec != null && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Durée : {fmtDuration(entry.durationSec)}
          </p>
        )}

        {entry.scoreValue !== undefined && entry.scoreValue !== null && (
          <div className="mt-1.5">
            <Stars value={entry.scoreValue} />
          </div>
        )}

        {entry.attachmentName && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-secondary border border-border px-3 py-2">
            {(() => {
              const A =
                ATTACH_ICONS[
                  (entry.attachmentKind ??
                    "document") as keyof typeof ATTACH_ICONS
                ];
              return <A className="w-4 h-4 text-violet-400" />;
            })()}
            <span className="text-xs text-foreground font-medium">
              {entry.attachmentName}
            </span>
            {entry.attachmentSize && (
              <span className="text-[10px] text-muted-foreground/70">
                {entry.attachmentSize}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── COMPOSER ───────────────────────────────────────────────────

type ComposerMode = "message" | "note" | "escalade";

function roleComposerModes(role: FeedRole): ComposerMode[] {
  switch (role) {
    case "client":
      return ["message"];
    case "pm":
      return ["message", "note", "escalade"];
    case "agency":
      return ["message", "escalade"];
    case "admin":
      return ["note"];
  }
}

const MODE_LABELS: Record<ComposerMode, string> = {
  message: "Message",
  note: "Note interne",
  escalade: "Escalade",
};

// ── COMPOSANT PRINCIPAL ────────────────────────────────────────

export interface ProjectFeedProps {
  /** Id du projet dans le domaine MOCK_PROJECTS (proj-001…). */
  projectId: string;
  /** Titre du projet (sert à la clé de conversation PM↔agence). */
  projectTitle: string;
  role: FeedRole;
  className?: string;
  /** Masquer le composer (ex. supervision admin en lecture seule). */
  readOnly?: boolean;
}

export function ProjectFeed({
  projectId,
  role,
  className,
  readOnly,
}: ProjectFeedProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Entrées du serveur : la matrice de visibilité est appliquée côté API.
  const { data: apiEntries } = useListFeedEntries(projectId, {
    query: {
      queryKey: getListFeedEntriesQueryKey(projectId),
      refetchInterval: 5_000,
    },
  });
  const entries: FeedEntry[] = useMemo(
    () => (apiEntries ?? []).map((e) => ({ ...e, id: `api-${e.id}` })),
    [apiEntries],
  );
  const createEntry = useCreateFeedEntry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListFeedEntriesQueryKey(projectId),
        });
      },
      onError: () => {
        toast({
          title: "Envoi refusé",
          description:
            "Le serveur a refusé cette entrée (rôle ou canal non autorisé).",
          variant: "destructive",
        });
      },
    },
  });

  const { directEnabled } = useProjectCommStatus(projectId);
  const [filter, setFilter] = useState<FilterKey>("tous");

  // ── Filtres ──
  const activeDef = FILTER_DEFS.find((f) => f.key === filter)!;
  const filtered = activeDef.types
    ? entries.filter((e) => activeDef.types!.includes(e.type as FeedEntryType))
    : entries;
  const visibleFilters = FILTER_DEFS.filter(
    (f) => !(f.internalOnly && role === "client"),
  );

  // Groupement par jour
  const groups = useMemo(() => {
    const g: { day: string; items: FeedEntry[] }[] = [];
    for (const e of filtered) {
      const day = fmtDay(e.createdAt);
      const last = g[g.length - 1];
      if (last && last.day === day) last.items.push(e);
      else g.push({ day, items: [e] });
    }
    return g;
  }, [filtered]);

  // ── Composer ──
  const modes = roleComposerModes(role);
  const [mode, setMode] = useState<ComposerMode>(modes[0]);
  const [text, setText] = useState("");
  const [sensible, setSensible] = useState(false);

  const channelOptions: {
    value: MessageChannel;
    label: string;
    disabled?: boolean;
  }[] =
    role === "client"
      ? [
          { value: "client_pm", label: "Mon chef de projet" },
          ...(directEnabled
            ? [
                {
                  value: "client_agency" as const,
                  label: "Agence (supervisée)",
                },
              ]
            : []),
        ]
      : role === "pm"
        ? [
            { value: "client_pm", label: "Client" },
            { value: "pm_agency", label: "Agence" },
          ]
        : role === "agency"
          ? [
              { value: "pm_agency", label: "Chef de projet" },
              ...(directEnabled
                ? [
                    {
                      value: "client_agency" as const,
                      label: "Client (supervisée)",
                    },
                  ]
                : []),
            ]
          : [];
  const [channel, setChannel] = useState<MessageChannel>(
    channelOptions[0]?.value ?? "client_pm",
  );
  const safeChannel = channelOptions.some((c) => c.value === channel)
    ? channel
    : (channelOptions[0]?.value ?? "client_pm");

  async function submit() {
    const content = text.trim();
    if (!content) return;

    if (mode === "message") {
      createEntry.mutate({
        projectId,
        data: { mode: "message", channel: safeChannel, content },
      });
    } else if (mode === "note") {
      createEntry.mutate({
        projectId,
        data: { mode: "note", content, sensible },
      });
    } else {
      createEntry.mutate({ projectId, data: { mode: "escalade", content } });
      toast({
        title: "Escalade envoyée",
        description:
          role === "agency"
            ? "Votre chef de projet Silo a été notifié."
            : "L'administration a été notifiée.",
      });
    }
    setText("");
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Filtres */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        {visibleFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
              filter === f.key
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-secondary text-muted-foreground border-border hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="flex-1 space-y-5 min-h-0">
        {groups.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Aucune activité pour l'instant sur ce projet.
          </div>
        )}
        {groups.map((g) => (
          <div key={g.day + g.items[0]?.id}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px bg-border flex-1" />
              <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                {g.day}
              </span>
              <div className="h-px bg-border flex-1" />
            </div>
            <div className="space-y-3">
              {g.items.map((e) => (
                <FeedEntryCard key={e.id} entry={e} viewerRole={role} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      {!readOnly && modes.length > 0 && (
        <div className="mt-5 rounded-xl bg-card border border-border p-3">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {modes.length > 1 &&
              modes.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors",
                    mode === m
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "bg-secondary text-muted-foreground border-border hover:text-foreground",
                  )}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            {mode === "message" && channelOptions.length > 0 && (
              <div className="relative ml-auto">
                <select
                  value={safeChannel}
                  onChange={(e) => setChannel(e.target.value as MessageChannel)}
                  className="appearance-none bg-secondary border border-border rounded-lg pl-3 pr-7 py-1 text-[11px] text-foreground outline-none focus:border-primary/40"
                >
                  {channelOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            )}
            {mode === "note" && (
              <label className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sensible}
                  onChange={(e) => setSensible(e.target.checked)}
                  className="accent-primary"
                />
                <Lock className="w-3 h-3" /> Note sensible (admin + PM)
              </label>
            )}
            {mode === "escalade" && (
              <span className="ml-auto text-[11px] text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {role === "agency"
                  ? "Vers le chef de projet"
                  : "Vers l'administration"}
              </span>
            )}
          </div>
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={2}
              placeholder={
                mode === "message"
                  ? "Écrire un message…"
                  : mode === "note"
                    ? sensible
                      ? "Note sensible (visible admin + PM concerné)…"
                      : "Note de suivi interne…"
                    : "Décrire le problème à escalader…"
              }
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground/60 outline-none focus:border-primary/40 resize-none"
            />
            <button
              onClick={submit}
              disabled={!text.trim()}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              <Send className="w-3.5 h-3.5" /> Envoyer
            </button>
          </div>
          {role === "client" && !directEnabled && (
            <p className="mt-2 text-[10px] text-muted-foreground/70">
              Vos échanges passent par votre chef de projet Silo. Le contact
              direct avec l'agence n'est pas activé sur ce projet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
