import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SecureFileLink } from "@/components/files/SecureFileLink";
import {
  useGetProject,
  useListDeliverables,
  useListComments,
  useAddComment,
  getGetProjectQueryKey,
  getListDeliverablesQueryKey,
  getListCommentsQueryKey,
} from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  Video,
  Image as ImageIcon,
  FileText,
  Music,
  File,
  Calendar,
  Euro,
  MessageSquare,
  Upload,
  Clock,
  CheckCircle2,
  Send,
  FolderOpen,
  User,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Rss,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectFeed } from "@/components/feed/ProjectFeed";
import { TransactionJourney } from "@/components/shared/TransactionJourney";

const statusConfig: Record<
  string,
  { label: string; dot: string; text: string }
> = {
  lead: { label: "Lead", dot: "bg-slate-400", text: "text-slate-400" },
  devis: { label: "Devis", dot: "bg-amber-400", text: "text-amber-400" },
  production: {
    label: "Production",
    dot: "bg-blue-400",
    text: "text-blue-400",
  },
  post_production: {
    label: "Post-prod.",
    dot: "bg-violet-400",
    text: "text-violet-400",
  },
  livraison: { label: "Livraison", dot: "bg-cyan-400", text: "text-cyan-400" },
  termine: {
    label: "Terminé",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
  },
  annule: { label: "Annulé", dot: "bg-red-500", text: "text-red-400" },
};

const typeConfig: Record<string, { label: string; color: string }> = {
  mariage: {
    label: "Mariage",
    color: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
  clip: {
    label: "Clip artiste",
    color: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  },
  corporate: {
    label: "Corporate",
    color: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  },
  reseaux: {
    label: "Réseaux sociaux",
    color: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
};

const deliverableIcons: Record<string, typeof Video> = {
  video: Video,
  photo: ImageIcon,
  audio: Music,
  document: FileText,
  autre: File,
};

const workflowSteps = [
  { key: "lead", label: "Lead", icon: User },
  { key: "devis", label: "Devis", icon: FileText },
  { key: "production", label: "Production", icon: Video },
  { key: "post_production", label: "Post-prod.", icon: Clock },
  { key: "livraison", label: "Livraison", icon: Download },
  { key: "termine", label: "Terminé", icon: CheckCircle2 },
];

const TAB_ICONS: Record<string, typeof MessageSquare> = {
  resume: FolderOpen,
  feed: Rss,
  commentaires: MessageSquare,
  fichiers: Upload,
  livrables: Download,
  timeline: Clock,
};

type Tab =
  | "resume"
  | "feed"
  | "commentaires"
  | "fichiers"
  | "livrables"
  | "timeline";

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div
      className={cn(
        "rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-semibold text-primary flex-shrink-0",
        sz,
      )}
    >
      {initials}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Calendar;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
      </div>
      <p className="text-xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function ProjectDetail() {
  const [, params] = useRoute("/dashboard/projets/:id");
  const id = Number(params?.id);
  const { user } = useUser();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("resume");
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: project, isLoading } = useGetProject(id, {
    query: { enabled: !!id, queryKey: getGetProjectQueryKey(id) },
  });
  const { data: deliverables } = useListDeliverables(id, {
    query: { enabled: !!id, queryKey: getListDeliverablesQueryKey(id) },
  });
  const { data: comments } = useListComments(id, {
    query: { enabled: !!id, queryKey: getListCommentsQueryKey(id) },
  });
  const addComment = useAddComment();

  const handleSendComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    addComment.mutate(
      {
        id,
        data: {
          content: newComment.trim(),
          authorName: user?.firstName || "Client",
        },
      },
      {
        onSuccess: () => {
          setNewComment("");
          qc.invalidateQueries({ queryKey: getListCommentsQueryKey(id) });
        },
        onSettled: () => setSubmitting(false),
      },
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl animate-pulse space-y-4">
          <div className="h-6 w-40 bg-card rounded" />
          <div className="h-10 w-96 bg-card rounded" />
          <div className="h-4 w-full bg-card rounded" />
          <div className="h-80 bg-card rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl text-center py-24">
          <AlertCircle className="w-10 h-10 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground">Projet non trouvé.</p>
          <Link
            href="/dashboard/projets"
            className="text-primary text-sm mt-4 inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Retour aux projets
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[project.status] ?? statusConfig["lead"];
  const type = typeConfig[project.type] ?? {
    label: project.type,
    color: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  };
  const currentStepIdx = workflowSteps.findIndex(
    (s) => s.key === project.status,
  );
  const feedProjectId = `api-${project.id}`;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "resume", label: "Résumé" },
    { key: "feed", label: "Feed" },
    { key: "commentaires", label: "Commentaires", count: comments?.length },
    { key: "fichiers", label: "Fichiers" },
    { key: "livrables", label: "Livrables", count: deliverables?.length },
    { key: "timeline", label: "Historique" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link
            href="/dashboard"
            className="hover:text-foreground transition-colors"
          >
            Tableau de bord
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            href="/dashboard/projets"
            className="hover:text-foreground transition-colors"
          >
            Mes projets
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground truncate max-w-[200px]">
            {project.title}
          </span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border font-medium",
                  type.color,
                )}
              >
                {type.label}
              </span>
              <span className="text-xs text-muted-foreground">
                #{String(project.id).padStart(4, "0")}
              </span>
            </div>
            <h1 className="text-3xl font-semibold">{project.title}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-card border border-border">
              <div className={cn("w-2 h-2 rounded-full", status.dot)} />
              <span className={status.text}>{status.label}</span>
            </div>
          </div>
        </div>

        {/* Workflow Stepper */}
        {project.status !== "annule" && (
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-5">
              Progression
            </p>
            <div className="relative flex items-start justify-between">
              <div className="absolute top-4 left-0 right-0 h-px bg-border" />
              <div
                className="absolute top-4 left-0 h-px bg-primary transition-all duration-500"
                style={{
                  width:
                    currentStepIdx > 0
                      ? `${(currentStepIdx / (workflowSteps.length - 1)) * 100}%`
                      : "0%",
                }}
              />
              {workflowSteps.map((step, i) => {
                const StepIcon = step.icon;
                const done = i < currentStepIdx;
                const current = i === currentStepIdx;
                return (
                  <div
                    key={step.key}
                    className="relative flex flex-col items-center gap-2.5 z-10"
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                        done
                          ? "bg-primary border-primary"
                          : current
                            ? "bg-background border-primary ring-4 ring-primary/20"
                            : "bg-background border-border",
                      )}
                    >
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                      ) : (
                        <StepIcon
                          className={cn(
                            "w-3.5 h-3.5",
                            current
                              ? "text-primary"
                              : "text-muted-foreground/40",
                          )}
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium hidden md:block text-center leading-tight max-w-[60px]",
                        current
                          ? "text-primary"
                          : done
                            ? "text-muted-foreground"
                            : "text-muted-foreground/40",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Parcours 11 étapes */}
        {project.status !== "annule" && (
          <div className="mb-6">
            <TransactionJourney status={project.status} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto pb-px">
          {tabs.map((tab) => {
            const Icon = TAB_ICONS[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full font-medium",
                      activeTab === tab.key
                        ? "bg-primary/20 text-primary"
                        : "bg-border text-muted-foreground",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab: Feed */}
        {activeTab === "feed" && (
          <ProjectFeed
            projectId={feedProjectId}
            projectTitle={project.title}
            role="client"
          />
        )}

        {/* Tab: Résumé */}
        {activeTab === "resume" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Type" value={type.label} icon={Video} />
              {project.shootingDate && (
                <StatCard
                  label="Date de tournage"
                  value={new Date(project.shootingDate).toLocaleDateString(
                    "fr-FR",
                  )}
                  icon={Calendar}
                />
              )}
              {project.deliveryDate && (
                <StatCard
                  label="Livraison prévue"
                  value={new Date(project.deliveryDate).toLocaleDateString(
                    "fr-FR",
                  )}
                  icon={Calendar}
                />
              )}
              {project.amount && (
                <StatCard
                  label="Montant"
                  value={`${project.amount.toLocaleString("fr-FR")} €`}
                  sub="TTC"
                  icon={Euro}
                />
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />{" "}
                  Informations client
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Nom</span>
                    <span className="font-medium">{project.clientName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <a
                      href={`mailto:${project.clientEmail}`}
                      className="text-primary hover:underline text-xs truncate max-w-[180px]"
                    >
                      {project.clientEmail}
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Créé le</span>
                    <span>
                      {new Date(project.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />{" "}
                  Description du projet
                </h2>
                {project.description ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {project.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic">
                    Aucune description renseignée.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground" /> Brief
                &amp; Objectifs
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    label: "Objectif principal",
                    value:
                      "Capturer les moments clés de votre événement avec un regard cinématographique.",
                  },
                  {
                    label: "Ton &amp; Style",
                    value:
                      "Élégant, émotionnel, cinématographique. Inspiration : films de mariages premium.",
                  },
                  {
                    label: "Livrables attendus",
                    value: `${deliverables?.length ?? 0} fichier(s) confirmé(s). Film principal + teaser 90s.`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-4 rounded-lg bg-background/50 border border-border/50"
                  >
                    <p
                      className="text-xs font-medium text-muted-foreground mb-1.5"
                      dangerouslySetInnerHTML={{ __html: item.label }}
                    />
                    <p className="text-sm leading-relaxed">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Commentaires */}
        {activeTab === "commentaires" && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm">Messagerie du projet</h2>
              <span className="text-xs text-muted-foreground">
                {comments?.length ?? 0} message(s)
              </span>
            </div>
            <div className="p-6 space-y-5 min-h-[300px] max-h-[480px] overflow-y-auto">
              {!comments?.length ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Aucun message pour le moment.
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Posez vos questions ou laissez un commentaire.
                  </p>
                </div>
              ) : (
                comments.map((c) => {
                  const isMine = c.authorName === (user?.firstName || "Client");
                  return (
                    <div
                      key={c.id}
                      className={cn("flex gap-3", isMine && "flex-row-reverse")}
                    >
                      <Avatar name={c.authorName} />
                      <div
                        className={cn(
                          "flex-1 max-w-[75%]",
                          isMine && "items-end flex flex-col",
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-medium">
                            {c.authorName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                            isMine
                              ? "bg-primary/15 border border-primary/20 text-foreground rounded-tr-sm"
                              : "bg-background border border-border rounded-tl-sm",
                          )}
                        >
                          {c.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="px-6 py-4 border-t border-border">
              <div className="flex gap-3">
                <Avatar name={user?.firstName || "Moi"} />
                <div className="flex-1 flex items-end gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment();
                      }
                    }}
                    placeholder="Votre message... (Entrée pour envoyer)"
                    rows={2}
                    className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none transition-all"
                  />
                  <button
                    onClick={handleSendComment}
                    disabled={!newComment.trim() || submitting}
                    className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-all flex-shrink-0"
                  >
                    <Send className="w-4 h-4 text-primary-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Fichiers */}
        {activeTab === "fichiers" && (
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-card/50 p-10 text-center transition-all cursor-pointer group">
              <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="text-sm font-medium">Glissez vos fichiers ici</p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, images, vidéos, ZIP — max 500 MB
              </p>
              <button className="mt-4 px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-secondary transition-all">
                Parcourir les fichiers
              </button>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border">
                <h2 className="text-sm font-semibold">Fichiers partagés</h2>
              </div>
              <div className="py-14 text-center">
                <File className="w-8 h-8 mx-auto mb-3 text-muted-foreground/25" />
                <p className="text-sm text-muted-foreground">
                  Aucun fichier partagé pour l'instant.
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Les fichiers échangés avec Silo apparaîtront ici.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Livrables */}
        {activeTab === "livrables" && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-sm">Livrables finaux</h2>
              <span className="text-xs text-muted-foreground">
                {deliverables?.length ?? 0} fichier(s)
              </span>
            </div>
            {!deliverables?.length ? (
              <div className="py-16 text-center">
                <Download className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">
                  Aucun livrable disponible.
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Vos fichiers apparaîtront ici une fois livrés par Silo.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {deliverables.map((d) => {
                  const Icon = deliverableIcons[d.type] || File;
                  return (
                    <div
                      key={d.id}
                      className="flex items-center gap-4 px-6 py-4"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{d.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="capitalize">{d.type}</span>
                          {d.size && (
                            <>
                              <span>•</span>
                              <span>{d.size}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>
                            {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                          Disponible
                        </span>
                        <SecureFileLink
                          reference={d.url}
                          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/5 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Ouvrir
                        </SecureFileLink>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Timeline */}
        {activeTab === "timeline" && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Historique des actions</h2>
            </div>
            <div className="py-14 text-center">
              <Clock className="w-8 h-8 mx-auto mb-3 text-muted-foreground/25" />
              <p className="text-sm text-muted-foreground">
                Aucune action enregistrée pour le moment.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                L'historique des événements du projet s'affichera ici.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
