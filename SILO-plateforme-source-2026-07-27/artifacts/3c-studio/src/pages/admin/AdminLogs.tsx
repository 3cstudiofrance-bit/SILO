import { DashboardLayout } from "@/components/DashboardLayout";
import { Activity } from "lucide-react";

export default function AdminLogs() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Logs d'activité</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Journal des actions sensibles : permissions, finance, attribution, communication.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border text-center">
          <Activity className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Aucun log disponible</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
            L'audit log sera disponible dans une prochaine mise à jour. Les actions sensibles seront tracées ici.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
