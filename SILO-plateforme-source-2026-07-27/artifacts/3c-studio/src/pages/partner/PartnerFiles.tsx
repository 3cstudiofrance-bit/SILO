import { PartnerLayout } from "./PartnerLayout";
import { FolderOpen } from "lucide-react";

export default function PartnerFiles() {
  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fichiers</h1>
          <p className="text-sm text-muted-foreground mt-1">Documents et ressources partagés par votre chef de projet.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Aucun fichier partagé</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
            Les briefs, plannings et ressources de vos missions apparaîtront ici.
          </p>
        </div>
      </div>
    </PartnerLayout>
  );
}
