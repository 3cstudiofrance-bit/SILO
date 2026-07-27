import { PartnerLayout } from "./PartnerLayout";
import { FileText, Calendar, Briefcase, Loader2 } from "lucide-react";
import { useListPartnerMissions } from "@workspace/api-client-react";

export default function PartnerBrief() {
  const { data: missions = [], isLoading } = useListPartnerMissions();
  const activeMissions = missions.filter(m => ["acceptee", "en_cours"].includes(m.status ?? ""));

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Briefs</h1>
          <p className="text-sm text-muted-foreground mt-1">Le cadrage détaillé de chaque mission attribuée.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : activeMissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border text-center">
            <Briefcase className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Aucune mission active</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
              Les briefs de vos missions en cours apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeMissions.map(m => (
              <div key={m.id} className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{m.title}</p>
                    {m.dueDate && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        Échéance : {new Date(m.dueDate).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                  {m.amount && (
                    <span className="text-sm font-bold shrink-0">{m.amount.toLocaleString("fr-FR")} €</span>
                  )}
                </div>

                {m.brief && (
                  <div className="rounded-xl bg-background/60 border border-border p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> Brief
                    </p>
                    <p className="text-sm text-foreground/90">{m.brief}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PartnerLayout>
  );
}
