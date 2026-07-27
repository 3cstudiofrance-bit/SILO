import { useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { useListPartnerMissions } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MessageThread } from "@/components/chat/MessageThread";
import { cn } from "@/lib/utils";

export default function AgencyMessages() {
  const { data: missions = [], isLoading } = useListPartnerMissions();
  const conversations = missions.filter(
    (mission) => mission.projectId && mission.status !== "refuse",
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const effectiveId = selectedId ?? conversations[0]?.id ?? null;
  const current =
    conversations.find((mission) => mission.id === effectiveId) ??
    conversations[0] ??
    null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (conversations.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            Aucune conversation active
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Une conversation est ouverte dès qu’une mission vous est attribuée.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="-m-5 flex h-[calc(100vh-3.5rem-2.5rem)] overflow-hidden border border-border md:-m-8">
        <div className="flex w-72 flex-shrink-0 flex-col border-r border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="mb-1 text-sm font-semibold text-foreground">
              Messages
            </h2>
            <p className="text-xs text-muted-foreground/70">
              Conseillers SILO
            </p>
          </div>
          <div className="flex-1 divide-y divide-border overflow-y-auto">
            {conversations.map((mission) => (
              <button
                key={mission.id}
                type="button"
                onClick={() => setSelectedId(mission.id)}
                className={cn(
                  "flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors",
                  current?.id === mission.id
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:bg-secondary",
                )}
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/20 text-xs font-bold text-emerald-400">
                  SI
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">
                    Conseiller SILO
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground/70">
                    {mission.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-border p-4">
            <div className="border border-border bg-secondary p-3">
              <p className="text-xs leading-relaxed text-muted-foreground/70">
                Vous échangez avec SILO. Le contact client direct reste désactivé
                tant que l’administrateur et le conseiller ne l’ont pas autorisé.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col bg-background">
          {current && (
            <div className="flex items-center gap-3 border-b border-border bg-card px-5 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/20 text-xs font-bold text-emerald-400">
                SI
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Conseiller SILO
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  {current.title}
                </p>
              </div>
            </div>
          )}
          <MessageThread
            projectId={current?.projectId ?? null}
            channel="pm_agency"
            partnerUserId={current?.partnerId}
            placeholder="Message à votre conseiller…"
            className="flex-1"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
