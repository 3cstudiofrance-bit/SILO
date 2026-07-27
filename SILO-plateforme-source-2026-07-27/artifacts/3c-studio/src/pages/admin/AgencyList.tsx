import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  AlertTriangle,
  Building2,
  Loader2,
  Search,
  UserRoundCheck,
} from "lucide-react";
import { useListPartners } from "@workspace/api-client-react";
import { ADVISOR_PARTNER_PORTFOLIO_TARGET } from "@/lib/finance";
import { StatCard } from "@/components/shared/StatCard";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "À valider",
  active: "Actif",
  suspended: "Suspendu",
  rejected: "Refusé",
};

export default function AgencyList() {
  const { data: partners = [], isLoading } = useListPartners();
  const [search, setSearch] = useState("");

  const filtered = partners.filter((partner) => {
    const query = search.trim().toLowerCase();
    return (
      !query ||
      partner.name.toLowerCase().includes(query) ||
      partner.email.toLowerCase().includes(query) ||
      partner.city?.toLowerCase().includes(query)
    );
  });

  const portfolioCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const partner of partners) {
      if (
        !partner.advisorUserId ||
        !["pending", "active"].includes(partner.status)
      ) {
        continue;
      }
      counts.set(
        partner.advisorUserId,
        (counts.get(partner.advisorUserId) ?? 0) + 1,
      );
    }
    return counts;
  }, [partners]);

  const overloadedPortfolios = Array.from(portfolioCounts.values()).filter(
    (count) => count > ADVISOR_PARTNER_PORTFOLIO_TARGET,
  ).length;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Partenaires
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Annuaire des agences et prestataires individuels.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Partenaires actifs"
            value={partners.filter((partner) => partner.status === "active").length}
            icon={Building2}
            description={`${partners.length} profils au total`}
          />
          <StatCard
            label="À valider"
            value={partners.filter((partner) => partner.status === "pending").length}
            icon={UserRoundCheck}
            description="Onboarding en attente"
          />
          <StatCard
            label="Portefeuilles à revoir"
            value={overloadedPortfolios}
            icon={AlertTriangle}
            description={`Cible de ${ADVISOR_PARTNER_PORTFOLIO_TARGET} partenaires`}
            accent={overloadedPortfolios > 0 ? "text-amber-400" : undefined}
          />
        </div>

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom, e-mail ou ville"
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border text-center">
            <Building2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {search ? "Aucun partenaire trouvé" : "Aucun partenaire enregistré"}
            </p>
          </div>
        ) : (
          <div className="border border-border overflow-x-auto">
            <table className="w-full min-w-[840px]">
              <thead>
                <tr className="border-b border-border bg-card/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Partenaire
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Spécialités
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Conseiller
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((partner, index) => (
                  <tr
                    key={partner.id}
                    className={cn(
                      "hover:bg-card/50 transition-colors",
                      index < filtered.length - 1 && "border-b border-border",
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{partner.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {partner.email}
                        {partner.city ? ` · ${partner.city}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {partner.kind === "agency"
                        ? "Agence"
                        : "Indépendant"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {partner.specialties.length
                        ? partner.specialties.join(", ")
                        : "Non renseigné"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono text-muted-foreground">
                        {partner.advisorUserId ?? "Non affecté"}
                      </p>
                      {partner.advisorUserId && (
                        <p className="text-[11px] text-muted-foreground/70">
                          {portfolioCounts.get(partner.advisorUserId) ?? 0}/
                          {ADVISOR_PARTNER_PORTFOLIO_TARGET} partenaires
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          partner.status === "active"
                            ? "text-emerald-400"
                            : partner.status === "pending"
                              ? "text-amber-400"
                              : "text-muted-foreground",
                        )}
                      >
                        {STATUS_LABELS[partner.status] ?? partner.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
