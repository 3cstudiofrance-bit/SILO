import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Loader2,
  Users,
} from "lucide-react";
import {
  getListPartnerMissionsQueryKey,
  useCreatePartnerMission,
  useListPartnerMissions,
  useListPartners,
  useListProjects,
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { computeSplit } from "@/lib/finance";
import { useToast } from "@/hooks/use-toast";

const ACTIVE_PROJECT_STATUSES = new Set([
  "lead",
  "devis",
  "production",
  "post_production",
  "livraison",
]);

const MISSION_STATUS_LABELS: Record<string, string> = {
  en_attente: "Proposée",
  accepte: "Acceptée",
  en_cours: "En cours",
  livre: "Livrée",
  valide: "Validée",
  refuse: "Refusée",
};

export default function PMAttribution() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: projects = [], isLoading: projectsLoading } =
    useListProjects();
  const { data: partners = [], isLoading: partnersLoading } =
    useListPartners();
  const { data: missions = [], isLoading: missionsLoading } =
    useListPartnerMissions();
  const createMission = useCreatePartnerMission();
  const [projectId, setProjectId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [brief, setBrief] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");

  const eligibleProjects = projects.filter((project) =>
    ACTIVE_PROJECT_STATUSES.has(project.status),
  );
  const activePartners = partners.filter(
    (partner) => partner.status === "active",
  );
  const selectedProject = eligibleProjects.find(
    (project) => project.id === Number(projectId),
  );
  const selectedPartner = activePartners.find(
    (partner) => partner.userId === partnerId,
  );
  const projectMissionCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const mission of missions) {
      if (mission.projectId && mission.status !== "refuse") {
        counts.set(
          mission.projectId,
          (counts.get(mission.projectId) ?? 0) + 1,
        );
      }
    }
    return counts;
  }, [missions]);

  useEffect(() => {
    if (selectedProject?.amount) {
      setAmount(String(computeSplit(selectedProject.amount).partAgence));
    } else {
      setAmount("");
    }
    setDueDate(selectedProject?.deliveryDate ?? "");
  }, [selectedProject]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProject || !selectedPartner) return;
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Rémunération invalide",
        description: "Indiquez la part partenaire en EUR HT.",
        variant: "destructive",
      });
      return;
    }

    createMission.mutate(
      {
        data: {
          projectId: selectedProject.id,
          partnerId: selectedPartner.userId,
          partnerName: selectedPartner.name,
          title: selectedProject.title,
          brief: brief.trim() || selectedProject.description || undefined,
          dueDate: dueDate || undefined,
          amount: parsedAmount,
        },
      },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: getListPartnerMissionsQueryKey(),
          });
          setPartnerId("");
          setBrief("");
          toast({
            title: "Mission proposée",
            description: `${selectedPartner.name} peut maintenant accepter la mission.`,
          });
        },
        onError: (error) => {
          toast({
            title: "Attribution refusée",
            description:
              error instanceof Error ? error.message : undefined,
            variant: "destructive",
          });
        },
      },
    );
  };

  const isLoading = projectsLoading || partnersLoading || missionsLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Attribution partenaire
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Proposez les projets de votre portefeuille aux partenaires actifs.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : eligibleProjects.length === 0 ? (
          <EmptyState
            title="Aucun projet à attribuer"
            detail="Les projets actifs qui vous sont assignés apparaîtront ici."
          />
        ) : activePartners.length === 0 ? (
          <EmptyState
            title="Aucun partenaire actif dans votre portefeuille"
            detail="L’administrateur doit valider le partenaire et l’affecter à votre portefeuille."
          />
        ) : (
          <form
            onSubmit={submit}
            className="grid gap-5 border border-border bg-card p-5 lg:grid-cols-2"
          >
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="mission-project"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  Projet
                </label>
                <select
                  id="mission-project"
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  required
                  className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Choisir un projet</option>
                  {eligibleProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title} · {project.clientName} ·{" "}
                      {projectMissionCounts.get(project.id) ?? 0} partenaire(s)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="mission-partner"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  Partenaire
                </label>
                <select
                  id="mission-partner"
                  value={partnerId}
                  onChange={(event) => setPartnerId(event.target.value)}
                  required
                  className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Choisir un partenaire</option>
                  {activePartners.map((partner) => (
                    <option key={partner.id} value={partner.userId}>
                      {partner.name} ·{" "}
                      {partner.kind === "agency" ? "Agence" : "Indépendant"}
                      {partner.city ? ` · ${partner.city}` : ""}
                    </option>
                  ))}
                </select>
                {selectedPartner?.specialties.length ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {selectedPartner.specialties.join(", ")}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="mission-brief"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  Brief partenaire
                </label>
                <textarea
                  id="mission-brief"
                  value={brief}
                  onChange={(event) => setBrief(event.target.value)}
                  rows={5}
                  placeholder={selectedProject?.description || "Périmètre, livrables et contraintes"}
                  className="w-full resize-none border border-border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="mission-date"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    Échéance
                  </label>
                  <input
                    id="mission-date"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label
                    htmlFor="mission-amount"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    Part partenaire (EUR HT)
                  </label>
                  <input
                    id="mission-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                    className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="border border-blue-400/20 bg-blue-400/5 p-4 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">
                  Contrôle financier
                </p>
                <p className="mt-1">
                  La rémunération proposée est préremplie à 70 % du montant HT
                  du projet. Les frais PSP et le net final restent calculés lors
                  de la transaction confirmée.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  !selectedProject ||
                  !selectedPartner ||
                  createMission.isPending
                }
                className="inline-flex w-full items-center justify-center gap-2 bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createMission.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Proposer la mission
              </button>
            </div>
          </form>
        )}

        {missions.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Attributions récentes
            </h2>
            <div className="overflow-x-auto border border-border">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-border bg-card/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Mission
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Partenaire
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Échéance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                      Rémunération
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {missions
                    .slice()
                    .reverse()
                    .map((mission) => (
                      <tr
                        key={mission.id}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className="px-4 py-3 text-sm font-medium">
                          {mission.title}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {mission.partnerName}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {mission.dueDate
                              ? new Date(mission.dueDate).toLocaleDateString(
                                  "fr-FR",
                                )
                              : "À définir"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {MISSION_STATUS_LABELS[mission.status] ??
                            mission.status}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          {mission.amount
                            ? `${mission.amount.toLocaleString("fr-FR")} EUR HT`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-border py-20 text-center">
      <div className="mb-3 flex items-center gap-3">
        <Users className="h-8 w-8 text-muted-foreground/30" />
        <Building2 className="h-8 w-8 text-muted-foreground/30" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground/60">
        {detail}
      </p>
    </div>
  );
}
