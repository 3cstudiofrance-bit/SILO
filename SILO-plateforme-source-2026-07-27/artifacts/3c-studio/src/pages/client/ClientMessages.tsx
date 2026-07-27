import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MessageThread } from "@/components/chat/MessageThread";
import { MessageSquare, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useListProjects } from "@workspace/api-client-react";

export default function ClientMessages() {
  const { data: projects = [], isLoading } = useListProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const conversations = projects.map(p => ({
    id: p.id,
    projectId: p.id,
    projectTitle: p.title,
    initials: p.title.slice(0, 2).toUpperCase(),
  }));

  const filtered = conversations.filter(c =>
    c.projectTitle.toLowerCase().includes(search.toLowerCase())
  );

  const effectiveId = selectedProjectId ?? filtered[0]?.id ?? null;
  const current = filtered.find(c => c.id === effectiveId) ?? filtered[0] ?? null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (conversations.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Aucun projet actif</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Vos conversations avec votre chef de projet apparaîtront ici.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-3.5rem-2.5rem)] -m-5 md:-m-8 rounded-xl overflow-hidden border border-border">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground mb-3">Messages</h2>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full bg-secondary border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder-muted-foreground/60 outline-none focus:border-primary/40"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedProjectId(conv.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                  current?.id === conv.id
                    ? "bg-primary/10 border-l-2 border-primary"
                    : "hover:bg-secondary border-l-2 border-transparent"
                )}
              >
                <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                  {conv.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{conv.projectTitle}</p>
                  <p className="text-[11px] text-muted-foreground/70">Chef de projet Silo</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat zone */}
        <div className="flex-1 flex flex-col bg-background">
          {current && (
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {current.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{current.projectTitle}</p>
                  <p className="text-[11px] text-muted-foreground/70">Chef de projet Silo</p>
                </div>
              </div>
            </div>
          )}
          <MessageThread
            projectId={current?.projectId ?? null}
            channel="client_pm"
            placeholder="Envoyer un message à votre chef de projet…"
            className="flex-1"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
