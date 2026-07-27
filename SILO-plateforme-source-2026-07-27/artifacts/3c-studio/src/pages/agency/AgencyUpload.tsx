import { useMemo } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  File,
  FileText,
  Film,
  Image,
  Loader2,
  Music,
  Package,
} from "lucide-react";
import {
  getListDeliverablesQueryKey,
  listDeliverables,
  useAddDeliverable,
  useListPartnerMissions,
  type Deliverable,
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FileUploader } from "@/components/files/FileUploader";
import { STORAGE_BUCKETS } from "@/types";
import { cn } from "@/lib/utils";

const ACTIVE_UPLOAD_STATUSES = new Set(["accepte", "en_cours", "livre"]);

const STATUS = {
  pending_review: {
    label: "En attente de validation",
    icon: Clock,
    color: "text-amber-400",
    background: "bg-amber-500/10 border-amber-500/20",
  },
  approved: {
    label: "Validé",
    icon: CheckCircle,
    color: "text-emerald-400",
    background: "bg-emerald-500/10 border-emerald-500/20",
  },
  changes_requested: {
    label: "Corrections demandées",
    icon: AlertCircle,
    color: "text-red-400",
    background: "bg-red-500/10 border-red-500/20",
  },
} as const;

const FILE_TYPE = {
  video: { icon: Film, color: "text-violet-400" },
  photo: { icon: Image, color: "text-blue-400" },
  audio: { icon: Music, color: "text-pink-400" },
  document: { icon: FileText, color: "text-slate-400" },
  autre: { icon: File, color: "text-slate-400" },
} as const;

function apiFileType(file: globalThis.File): Deliverable["type"] {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "photo";
  if (file.type.startsWith("audio/")) return "audio";
  if (
    file.type === "application/pdf" ||
    file.type.startsWith("text/") ||
    /\.(pdf|docx?|xlsx?|pptx?)$/i.test(file.name)
  ) {
    return "document";
  }
  return "autre";
}

export default function AgencyUpload() {
  const queryClient = useQueryClient();
  const { data: missions = [], isLoading: missionsLoading } =
    useListPartnerMissions();
  const addDeliverable = useAddDeliverable();
  const activeMissions = missions.filter(
    (mission) =>
      mission.projectId && ACTIVE_UPLOAD_STATUSES.has(mission.status),
  );
  const projectIds = useMemo(
    () => [
      ...new Set(
        missions
          .map((mission) => mission.projectId)
          .filter((id): id is number => Boolean(id)),
      ),
    ],
    [missions],
  );
  const deliverableQueries = useQueries({
    queries: projectIds.map((projectId) => ({
      queryKey: getListDeliverablesQueryKey(projectId),
      queryFn: () => listDeliverables(projectId),
    })),
  });
  const deliverables = useMemo(
    () =>
      deliverableQueries.flatMap((query, index) => {
        const projectId = projectIds[index];
        const mission = missions.find(
          (candidate) => candidate.projectId === projectId,
        );
        return (query.data ?? []).map((deliverable) => ({
          ...deliverable,
          missionTitle: mission?.title ?? `Projet ${projectId}`,
        }));
      }),
    [deliverableQueries, missions, projectIds],
  );
  const isLoading =
    missionsLoading || deliverableQueries.some((query) => query.isLoading);

  const registerUpload = async (
    projectId: number,
    url: string,
    _path: string,
    file: globalThis.File,
  ) => {
    const previousVersions = deliverables.filter(
      (deliverable) =>
        deliverable.projectId === projectId &&
        deliverable.name === file.name,
    ).length;
    await addDeliverable.mutateAsync({
      id: projectId,
      data: {
        name: file.name,
        url,
        type: apiFileType(file),
        size: `${(file.size / 1024 / 1024).toLocaleString("fr-FR", {
          maximumFractionDigits: 1,
        })} Mo`,
        version: previousVersions + 1,
      },
    });
    await queryClient.invalidateQueries({
      queryKey: getListDeliverablesQueryKey(projectId),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Dépôt des livrables
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Déposez les rendus de vos missions pour validation par SILO.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activeMissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-border py-20 text-center">
            <Package className="mb-3 h-9 w-9 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              Aucune mission prête pour un dépôt
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Acceptez d’abord une mission depuis l’écran Mes missions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeMissions.map((mission) => (
              <section
                key={mission.id}
                className="space-y-4 border border-border bg-card p-5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      {mission.title}
                    </h2>
                    {mission.brief && (
                      <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
                        {mission.brief}
                      </p>
                    )}
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {mission.dueDate
                      ? `Échéance ${new Date(mission.dueDate).toLocaleDateString("fr-FR")}`
                      : "Échéance à confirmer"}
                  </p>
                </div>
                <FileUploader
                  projectId={String(mission.projectId)}
                  bucket={STORAGE_BUCKETS.DELIVERABLES}
                  accept="video/*,image/*,audio/*,application/zip,.pdf,.doc,.docx"
                  maxSizeMb={20_480}
                  onUploadComplete={(url, path, file) =>
                    registerUpload(
                      mission.projectId as number,
                      url,
                      path,
                      file,
                    )
                  }
                />
              </section>
            ))}
          </div>
        )}

        {deliverables.length > 0 && (
          <section className="border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Fichiers envoyés
              </h2>
            </div>
            <div className="divide-y divide-border">
              {deliverables
                .slice()
                .reverse()
                .map((deliverable) => {
                  const status = STATUS[deliverable.status];
                  const fileType = FILE_TYPE[deliverable.type];
                  const StatusIcon = status.icon;
                  const FileIcon = fileType.icon;
                  return (
                    <div
                      key={deliverable.id}
                      className="flex items-center gap-4 px-5 py-4"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center border border-border bg-secondary">
                        <FileIcon
                          className={cn("h-4 w-4", fileType.color)}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {deliverable.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground/70">
                          {deliverable.missionTitle} · v{deliverable.version}
                          {deliverable.size ? ` · ${deliverable.size}` : ""}
                        </p>
                        {deliverable.reviewNotes && (
                          <p className="mt-1 text-xs text-red-400">
                            {deliverable.reviewNotes}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "flex items-center gap-1 border px-2 py-0.5 text-xs font-medium",
                          status.background,
                          status.color,
                        )}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </div>
                  );
                })}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
