import { DashboardLayout } from "@/components/DashboardLayout";
import { SecureFileLink } from "@/components/files/SecureFileLink";
import {
  useGetProject,
  useUpdateProject,
  useListDeliverables,
  useAddDeliverable,
  useDeleteDeliverable,
  getGetProjectQueryKey,
  getListDeliverablesQueryKey,
} from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  Video,
  Image,
  FileText,
  Music,
  File,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { TransactionJourney } from "@/components/shared/TransactionJourney";

const statusOptions = [
  { value: "lead", label: "Lead" },
  { value: "devis", label: "Devis" },
  { value: "production", label: "Production" },
  { value: "post_production", label: "Post-production" },
  { value: "livraison", label: "Livraison" },
  { value: "termine", label: "Terminé" },
  { value: "annule", label: "Annulé" },
];

const statusColors: Record<string, string> = {
  lead: "bg-gray-500/20 text-gray-400",
  devis: "bg-yellow-500/20 text-yellow-400",
  production: "bg-blue-500/20 text-blue-400",
  post_production: "bg-violet-500/20 text-violet-400",
  livraison: "bg-emerald-500/20 text-emerald-400",
  termine: "bg-green-500/20 text-green-400",
  annule: "bg-red-500/20 text-red-400",
};

const deliverableIcons: Record<string, typeof Video> = {
  video: Video,
  photo: Image,
  audio: Music,
  document: FileText,
  autre: File,
};

const updateSchema = z.object({
  status: z.enum([
    "lead",
    "devis",
    "production",
    "post_production",
    "livraison",
    "termine",
    "annule",
  ]),
  description: z.string().optional(),
  amount: z.number().optional(),
  shootingDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  clientUserId: z.string().optional(),
  advisorUserId: z.string().optional(),
});

const deliverableSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  url: z.string().url("URL invalide"),
  type: z.enum(["video", "photo", "audio", "document", "autre"]),
  size: z.string().optional(),
});
type DelForm = z.infer<typeof deliverableSchema>;

export default function AdminProjectDetail() {
  const [, params] = useRoute("/admin/projets/:id");
  const id = Number(params?.id);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDelForm, setShowDelForm] = useState(false);

  const { data: project, isLoading } = useGetProject(id, {
    query: { enabled: !!id, queryKey: getGetProjectQueryKey(id) },
  });
  const { data: deliverables } = useListDeliverables(id, {
    query: { enabled: !!id, queryKey: getListDeliverablesQueryKey(id) },
  });
  const updateProject = useUpdateProject();
  const addDeliverable = useAddDeliverable();
  const deleteDeliverable = useDeleteDeliverable();

  const updateForm = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema),
    values: project
      ? {
          status: project.status as any,
          description: project.description || "",
          amount: project.amount || undefined,
          shootingDate: project.shootingDate || "",
          deliveryDate: project.deliveryDate || "",
          clientUserId: project.clientUserId || "",
          advisorUserId: project.advisorUserId || "",
        }
      : undefined,
  });

  const delForm = useForm<DelForm>({
    resolver: zodResolver(deliverableSchema),
    defaultValues: { type: "video", name: "", url: "", size: "" },
  });

  const onUpdateSubmit = (data: z.infer<typeof updateSchema>) => {
    updateProject.mutate(
      {
        id,
        data: {
          ...data,
          clientUserId: data.clientUserId || undefined,
          advisorUserId: data.advisorUserId || null,
          amount: data.amount || undefined,
          description: data.description || undefined,
          shootingDate: data.shootingDate || undefined,
          deliveryDate: data.deliveryDate || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Projet mis à jour" });
          queryClient.invalidateQueries({
            queryKey: getGetProjectQueryKey(id),
          });
        },
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
      },
    );
  };

  const onAddDeliverable = (data: DelForm) => {
    addDeliverable.mutate(
      { id, data: { ...data, size: data.size || undefined } },
      {
        onSuccess: () => {
          toast({ title: "Livrable ajouté" });
          queryClient.invalidateQueries({
            queryKey: getListDeliverablesQueryKey(id),
          });
          setShowDelForm(false);
          delForm.reset();
        },
        onError: () => toast({ title: "Erreur", variant: "destructive" }),
      },
    );
  };

  const onDeleteDeliverable = async (delId: number) => {
    if (!confirm("Supprimer ce livrable ?")) return;
    deleteDeliverable.mutate(
      { id: delId },
      {
        onSuccess: () => {
          toast({ title: "Livrable supprimé" });
          queryClient.invalidateQueries({
            queryKey: getListDeliverablesQueryKey(id),
          });
        },
      },
    );
  };

  if (isLoading || !project) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl">
          <div className="h-64 bg-card rounded-2xl animate-pulse border border-border" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <Link
          href="/admin/projets"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux projets
        </Link>

        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold">{project.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {project.clientName} · {project.clientEmail}
            </p>
          </div>
          <span
            className={`text-sm px-3 py-1.5 rounded-full ${statusColors[project.status]}`}
          >
            {statusOptions.find((s) => s.value === project.status)?.label}
          </span>
        </div>

        <div className="mb-6">
          <TransactionJourney status={project.status} />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Update form */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-5">Modifier le projet</h2>
            <form
              onSubmit={updateForm.handleSubmit(onUpdateSubmit)}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium mb-1.5">
                  Statut
                </label>
                <select
                  {...updateForm.register("status")}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">
                  Montant (€)
                </label>
                <input
                  {...updateForm.register("amount", { valueAsNumber: true })}
                  type="number"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">
                  Clerk User ID client
                </label>
                <input
                  {...updateForm.register("clientUserId")}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-xs"
                  placeholder="user_..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">
                  Clerk User ID conseiller
                </label>
                <input
                  {...updateForm.register("advisorUserId")}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-xs"
                  placeholder="user_..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">
                  Date tournage
                </label>
                <input
                  {...updateForm.register("shootingDate")}
                  type="date"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">
                  Date livraison
                </label>
                <input
                  {...updateForm.register("deliveryDate")}
                  type="date"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5">
                  Description
                </label>
                <textarea
                  {...updateForm.register("description")}
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={updateProject.isPending}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60"
              >
                {updateProject.isPending ? "Mise à jour..." : "Enregistrer"}
              </button>
            </form>
          </div>

          {/* Deliverables */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">
                Livrables ({deliverables?.length ?? 0})
              </h2>
              <button
                onClick={() => setShowDelForm(!showDelForm)}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>

            {showDelForm && (
              <div className="p-5 border-b border-border">
                <form
                  onSubmit={delForm.handleSubmit(onAddDeliverable)}
                  className="space-y-3"
                >
                  <div>
                    <input
                      {...delForm.register("name")}
                      placeholder="Nom du fichier"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {delForm.formState.errors.name && (
                      <p className="text-xs text-destructive mt-1">
                        {delForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      {...delForm.register("url")}
                      placeholder="URL du fichier (https://...)"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {delForm.formState.errors.url && (
                      <p className="text-xs text-destructive mt-1">
                        {delForm.formState.errors.url.message}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      {...delForm.register("type")}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="video">Vidéo</option>
                      <option value="photo">Photo</option>
                      <option value="audio">Audio</option>
                      <option value="document">Document</option>
                      <option value="autre">Autre</option>
                    </select>
                    <input
                      {...delForm.register("size")}
                      placeholder="Taille (ex: 2.4 GB)"
                      className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={addDeliverable.isPending}
                      className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60"
                    >
                      {addDeliverable.isPending ? "Ajout..." : "Ajouter"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDelForm(false)}
                      className="px-3 py-2 rounded-lg border border-border text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="divide-y divide-border">
              {deliverables?.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Aucun livrable
                </div>
              ) : (
                deliverables?.map((d) => {
                  const Icon = deliverableIcons[d.type] || File;
                  return (
                    <div
                      key={d.id}
                      className="flex items-center gap-3 px-5 py-3.5"
                    >
                      <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{d.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.type}
                          {d.size && ` · ${d.size}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <SecureFileLink
                          reference={d.url}
                          className="text-primary transition-colors hover:text-primary/80"
                          title="Ouvrir le livrable"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </SecureFileLink>
                        <button
                          onClick={() => onDeleteDeliverable(d.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
