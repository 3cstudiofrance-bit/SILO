import { DashboardLayout } from "@/components/DashboardLayout";
import { Activity, Building2, Briefcase, Shield, User } from "lucide-react";
import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

type SpaceAccessLog = {
  id: number;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  role: string;
  space: "admin" | "pm" | "partner" | "client";
  path: string;
  accessedAt: string;
};

const spaceLabels = {
  admin: { label: "Administration", icon: Shield, className: "text-amber-400" },
  pm: { label: "Chef de projet", icon: Briefcase, className: "text-violet-400" },
  partner: { label: "Agence", icon: Building2, className: "text-emerald-400" },
  client: { label: "Client", icon: User, className: "text-blue-400" },
} as const;

export default function AdminLogs() {
  const { getToken } = useAuth();
  const logsQuery = useQuery({
    queryKey: ["space-access-logs"],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch("/api/auth/space-access?limit=200", {
        credentials: "same-origin",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as SpaceAccessLog[];
    },
    refetchInterval: 30_000,
  });
  const logs = logsQuery.data ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Logs d'activité</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Connexions aux espaces Administration, Chef de projet, Agence et Client.
          </p>
        </div>

        {logsQuery.isLoading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            Chargement du journal…
          </div>
        ) : logsQuery.isError ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">
            Le journal ne peut pas être chargé pour le moment.
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border text-center">
            <Activity className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Aucune connexion enregistrée</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
              Les prochains accès aux espaces apparaîtront automatiquement ici.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Utilisateur</th>
                    <th className="px-5 py-3 font-medium">Espace</th>
                    <th className="px-5 py-3 font-medium">Chemin</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => {
                    const config = spaceLabels[log.space];
                    const Icon = config.icon;
                    return (
                      <tr key={log.id} className="hover:bg-secondary/25">
                        <td className="px-5 py-4">
                          <p className="font-medium text-foreground">
                            {log.userName || log.userEmail || log.userId}
                          </p>
                          {log.userEmail && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{log.userEmail}</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-2 font-medium ${config.className}`}>
                            <Icon className="h-4 w-4" />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{log.path}</td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {new Intl.DateTimeFormat("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "medium",
                          }).format(new Date(log.accessedAt))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
