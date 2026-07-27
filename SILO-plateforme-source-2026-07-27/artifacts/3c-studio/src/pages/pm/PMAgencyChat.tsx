import { useState } from "react";
import { Building2, Loader2, Search } from "lucide-react";
import { useListPartnerMissions } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MessageThread } from "@/components/chat/MessageThread";
import { cn } from "@/lib/utils";

export default function PMAgencyChat() {
  const { data: missions = [], isLoading } = useListPartnerMissions();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const conversations = missions.filter(
    (mission) =>
      mission.projectId &&
      mission.status !== "refuse",
  );
  const filtered = conversations.filter((mission) => {
    const query = search.toLowerCase();
    return (
      mission.partnerName.toLowerCase().includes(query) ||
      mission.title.toLowerCase().includes(query)
    );
  });
  const effectiveId = selectedId ?? filtered[0]?.id ?? null;
  const current =
    filtered.find((mission) => mission.id === effectiveId) ??
    filtered[0] ??
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
          <Building2 className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            Aucune agence attribuée
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Les conversations apparaîtront après l’attribution d’une mission.
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
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Discussion agence
            </h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher…"
                className="w-full border border-border bg-secondary py-2 pl-8 pr-3 text-xs text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/40"
              />
            </div>
          </div>
          <div className="flex-1 divide-y divide-border overflow-y-auto">
            {filtered.map((mission) => (
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
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-xs font-bold text-muted-foreground">
                  {mission.partnerName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {mission.partnerName}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground/70">
                    {mission.title}
                  </p>
                  <p className="mt-0.5 text-[10px] capitalize text-muted-foreground">
                    {mission.status.replace("_", " ")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col bg-background">
          {current && (
            <div className="flex items-center gap-3 border-b border-border bg-card px-5 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-secondary text-xs font-bold text-muted-foreground">
                {current.partnerName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {current.partnerName}
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
            placeholder="Message à l’agence…"
            className="flex-1"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
