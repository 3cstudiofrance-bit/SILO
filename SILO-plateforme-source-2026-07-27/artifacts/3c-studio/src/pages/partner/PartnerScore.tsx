import { PartnerLayout } from "./PartnerLayout";
import { Star, TrendingUp } from "lucide-react";

export default function PartnerScore() {
  return (
    <PartnerLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Score agence</h1>
          <p className="text-sm text-muted-foreground mt-1">Votre score influe sur l'attribution des missions par les chefs de projet Silo.</p>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Un score élevé augmente votre priorité lors des présélections et peut déclencher une mise en avant sur le site.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border text-center">
          <Star className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Score non disponible</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
            Votre score apparaîtra ici une fois vos premières missions terminées et notées par les clients.
          </p>
        </div>
      </div>
    </PartnerLayout>
  );
}
