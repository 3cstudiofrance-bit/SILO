import { PartnerLayout } from "./PartnerLayout";
import { MessageSquare } from "lucide-react";

export default function PartnerCorrections() {
  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Corrections</h1>
          <p className="text-sm text-muted-foreground mt-1">Demandes de corrections transmises par le chef de projet après retour client.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border text-center">
          <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Aucune correction en cours</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
            Les demandes de corrections de vos chefs de projet apparaîtront ici.
          </p>
        </div>
      </div>
    </PartnerLayout>
  );
}
