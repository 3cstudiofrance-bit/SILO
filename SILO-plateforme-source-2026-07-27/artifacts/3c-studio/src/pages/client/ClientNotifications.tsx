import { DashboardLayout } from "@/components/DashboardLayout";
import { Bell, CheckCheck, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { NOTIFICATION_CONFIG } from "@/services/notificationService";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "À l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${Math.floor(hours / 24)}j`;
}

export default function ClientNotifications() {
  const { notifications, unreadCount, markRead, markAllAsRead, isLoading } = useNotifications();

  const unread = notifications.filter(n => !n.isRead);
  const read = notifications.filter(n => n.isRead);

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est à jour"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tout marquer lu
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-border bg-card">
            <Bell className="w-10 h-10 text-[#333] mb-3" />
            <p className="text-muted-foreground font-medium">Aucune notification</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Vous serez notifié des activités importantes</p>
          </div>
        ) : (
          <>
            {/* Non lues */}
            {unread.length > 0 && (
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Non lues</p>
                </div>
                <div className="divide-y divide-border">
                  {unread.map(n => {
                    const cfg = NOTIFICATION_CONFIG[n.type];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className="flex gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors bg-primary/[0.03]"
                      >
                        <div className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center text-base flex-shrink-0">
                          <Icon className={cn("h-4 w-4", cfg.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{n.title}</p>
                          {n.body && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>}
                          <p className="text-[10px] text-muted-foreground/70 mt-1.5">{timeAgo(n.createdAt)}</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lues */}
            {read.length > 0 && (
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Lues</p>
                </div>
                <div className="divide-y divide-border">
                  {read.map(n => {
                    const cfg = NOTIFICATION_CONFIG[n.type];
                    const Icon = cfg.icon;
                    return (
                      <div key={n.id} className="flex gap-4 px-5 py-4 opacity-60">
                        <div className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center text-base flex-shrink-0">
                          <Icon className={cn("h-4 w-4", cfg.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{n.title}</p>
                          {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                          <p className="text-[10px] text-muted-foreground/70 mt-1.5">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
