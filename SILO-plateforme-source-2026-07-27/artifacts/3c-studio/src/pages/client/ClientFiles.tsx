import { useMemo, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  File,
  FileText,
  FolderOpen,
  Image,
  Loader2,
  Music,
  Upload,
  Video,
} from "lucide-react";
import {
  getListProjectFilesQueryKey,
  listProjectFiles,
  useAddProjectFile,
  useListProjects,
  type Project,
  type ProjectFile,
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FileUploader } from "@/components/files/FileUploader";
import { SecureFileLink } from "@/components/files/SecureFileLink";
import { Button } from "@/components/ui/button";
import { STORAGE_BUCKETS } from "@/types";
import { formatFileSize, storageReference } from "@/services/fileService";
import { useToast } from "@/hooks/use-toast";

type ProjectFileRow = ProjectFile & { project: Project };

function fileIcon(mimeType?: string | null) {
  if (mimeType?.startsWith("video/")) return Video;
  if (mimeType?.startsWith("image/")) return Image;
  if (mimeType?.startsWith("audio/")) return Music;
  if (mimeType === "application/pdf" || mimeType?.startsWith("text/")) {
    return FileText;
  }
  return File;
}

export default function ClientFiles() {
  const [showUpload, setShowUpload] = useState(false);
  const [uploadProjectId, setUploadProjectId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: projects = [], isLoading: projectsLoading } = useListProjects();
  const addProjectFile = useAddProjectFile();
  const fileQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: getListProjectFilesQueryKey(project.id),
      queryFn: () => listProjectFiles(project.id),
    })),
  });
  const files = useMemo(
    () =>
      fileQueries.flatMap((query, index) =>
        (query.data ?? []).map((file) => ({
          ...file,
          project: projects[index],
        })),
      ),
    [fileQueries, projects],
  );
  const isLoading =
    projectsLoading || fileQueries.some((query) => query.isLoading);
  const isError = fileQueries.some((query) => query.isError);

  const registerUpload = async (
    projectId: number,
    path: string,
    file: globalThis.File,
  ) => {
    await addProjectFile.mutateAsync({
      id: projectId,
      data: {
        name: file.name,
        storageBucket: STORAGE_BUCKETS.CLIENT_UPLOADS,
        storagePath: path,
        mimeType: file.type || null,
        sizeBytes: file.size,
      },
    });
    await queryClient.invalidateQueries({
      queryKey: getListProjectFilesQueryKey(projectId),
    });
    toast({
      title: "Fichier partagé",
      description: `${file.name} est maintenant disponible dans le projet.`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mes fichiers</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Partagez des ressources privées avec votre conseiller SILO.
            </p>
          </div>
          {projects.length > 0 && (
            <Button
              onClick={() => {
                setShowUpload((visible) => !visible);
                if (!uploadProjectId && projects[0]) {
                  setUploadProjectId(projects[0].id);
                }
              }}
              className="gap-2 sm:ml-auto"
            >
              <Upload className="h-4 w-4" /> Envoyer un fichier
            </Button>
          )}
        </div>

        {showUpload && uploadProjectId && (
          <div className="space-y-4 rounded-lg border border-border bg-card p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-sm font-semibold">Envoyer des fichiers</h2>
              {projects.length > 1 && (
                <select
                  value={uploadProjectId}
                  onChange={(event) =>
                    setUploadProjectId(Number(event.target.value))
                  }
                  className="ml-auto rounded-md border border-border bg-secondary px-3 py-1.5 text-xs focus:outline-none"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <FileUploader
              projectId={String(uploadProjectId)}
              bucket={STORAGE_BUCKETS.CLIENT_UPLOADS}
              onUploadComplete={(_url, path, file) =>
                registerUpload(uploadProjectId, path, file)
              }
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex items-center gap-3 rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            Certains fichiers n’ont pas pu être chargés.
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-24 text-center">
            <FolderOpen className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              Aucun fichier partagé
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground/60">
              Les ressources déposées dans vos projets apparaîtront ici.
            </p>
          </div>
        ) : (
          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ressources partagées
              </h2>
            </div>
            <div className="divide-y divide-border">
              {files.map((file: ProjectFileRow) => {
                const FileIcon = fileIcon(file.mimeType);
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary">
                      <FileIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {file.project.title} · {formatFileSize(file.sizeBytes)}{" "}
                        · {new Date(file.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <SecureFileLink
                      reference={storageReference(
                        file.storageBucket,
                        file.storagePath,
                      )}
                      className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium text-primary hover:bg-primary/5"
                    >
                      Ouvrir
                    </SecureFileLink>
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
