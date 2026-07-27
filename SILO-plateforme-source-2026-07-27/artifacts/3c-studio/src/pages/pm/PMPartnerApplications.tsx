import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle,
  ExternalLink,
  FileCheck,
  Loader2,
  MapPin,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import {
  getListPartnersQueryKey,
  useListPartners,
  useUpdatePartner,
  type Partner,
} from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const STATUS = {
  pending: {
    label: "Vérification requise",
    color: "text-amber-400",
    background: "bg-amber-500/10",
    icon: FileCheck,
  },
  active: {
    label: "Partenaire actif",
    color: "text-emerald-400",
    background: "bg-emerald-500/10",
    icon: CheckCircle,
  },
  suspended: {
    label: "Suspendu",
    color: "text-slate-400",
    background: "bg-slate-500/10",
    icon: ShieldAlert,
  },
  rejected: {
    label: "Refusé",
    color: "text-red-400",
    background: "bg-red-500/10",
    icon: XCircle,
  },
} as const;

export default function PMPartnerApplications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: partners = [], isLoading, isError } = useListPartners();
  const updatePartner = useUpdatePartner();
  const pending = partners.filter((partner) => partner.status === "pending");
  const reviewed = partners.filter((partner) => partner.status !== "pending");

  const changeStatus = (
    partner: Partner,
    status: "active" | "rejected",
  ) => {
    if (
      status === "active" &&
      !window.confirm(
        "Confirmez-vous avoir vérifié manuellement l’identité, les justificatifs légaux, l’assurance et le contrat signé de ce partenaire ?",
      )
    ) {
      return;
    }
    if (
      status === "rejected" &&
      !window.confirm(`Refuser la candidature de ${partner.name} ?`)
    ) {
      return;
    }

    updatePartner.mutate(
      { id: partner.id, data: { status } },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: getListPartnersQueryKey(),
          });
          toast({
            title:
              status === "active"
                ? "Partenaire activé"
                : "Candidature refusée",
          });
        },
        onError: (error) => {
          toast({
            title: "Décision non enregistrée",
            description:
              error instanceof Error ? error.message : undefined,
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Souscriptions partenaire
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Qualification et décision sur les partenaires de votre portefeuille.
          </p>
        </div>

        <div className="flex items-start gap-3 border border-amber-400/20 bg-amber-400/5 p-4">
          <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
          <p className="text-xs text-muted-foreground">
            L’activation enregistre votre décision dans SILO. Elle ne remplace
            pas la vérification des pièces légales, de l’assurance ni de la
            signature du contrat.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-400">
            Les candidatures n’ont pas pu être chargées.
          </div>
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-border py-16 text-center">
            <Building2 className="mb-3 h-9 w-9 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              Aucune candidature à examiner
            </p>
          </div>
        ) : (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              À examiner ({pending.length})
            </h2>
            {pending.map((partner) => (
              <PartnerApplicationCard
                key={partner.id}
                partner={partner}
                pending={
                  updatePartner.isPending &&
                  updatePartner.variables?.id === partner.id
                }
                onActivate={() => changeStatus(partner, "active")}
                onReject={() => changeStatus(partner, "rejected")}
              />
            ))}
          </section>
        )}

        {reviewed.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Décisions enregistrées
            </h2>
            <div className="divide-y divide-border border border-border bg-card">
              {reviewed.map((partner) => {
                const status = STATUS[partner.status];
                const StatusIcon = status.icon;
                return (
                  <div
                    key={partner.id}
                    className="flex items-center gap-4 px-5 py-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {partner.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {partner.email}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium",
                        status.color,
                        status.background,
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

function PartnerApplicationCard({
  partner,
  pending,
  onActivate,
  onReject,
}: {
  partner: Partner;
  pending: boolean;
  onActivate: () => void;
  onReject: () => void;
}) {
  return (
    <div className="space-y-4 border border-border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {partner.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {partner.email} ·{" "}
            {partner.kind === "agency" ? "Agence" : "Indépendant"}
          </p>
          {partner.city && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {partner.city}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Spécialités :{" "}
            {partner.specialties.length
              ? partner.specialties.join(", ")
              : "non renseignées"}
          </p>
          {partner.portfolioUrl && (
            <a
              href={partner.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Consulter le portfolio
            </a>
          )}
        </div>
        <span className="bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
          Vérification requise
        </span>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onReject}
          disabled={pending}
          className="inline-flex items-center gap-1.5 border border-red-400/30 px-3 py-2 text-xs font-medium text-red-400 disabled:opacity-50"
        >
          <XCircle className="h-3.5 w-3.5" />
          Refuser
        </button>
        <button
          type="button"
          onClick={onActivate}
          disabled={pending}
          className="inline-flex items-center gap-1.5 bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle className="h-3.5 w-3.5" />
          )}
          Activer après vérification
        </button>
      </div>
    </div>
  );
}
