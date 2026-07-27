import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { NOTIFICATION_CONFIG } from "@/services/notificationService";
import type { Notification } from "@/types";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "À l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

function NotifItem({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
  const cfg = NOTIFICATION_CONFIG[notif.type];
  const Icon = cfg.icon;
  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3 hover:bg-card/50 transition-colors cursor-pointer group",
        !notif.isRead && "bg-primary/5"
      )}
      onClick={() => !notif.isRead && onRead(notif.id)}
    >
      <div className="shrink-0 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-sm">
        <Icon className={cn("h-4 w-4", cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs font-medium leading-snug", notif.isRead ? "text-muted-foreground" : "text-foreground")}>
          {notif.title}
        </p>
        {notif.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{notif.body}</p>
        )}
        <p className="text-[10px] text-muted-foreground/50 mt-1">{timeAgo(notif.createdAt)}</p>
      </div>
      {!notif.isRead && (
        <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
      )}
    </div>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-background border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <CheckCheck className="w-3 h-3" /> Tout lire
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="w-6 h-6 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Aucune notification</p>
              </div>
            ) : (
              notifications.map(n => (
                <NotifItem key={n.id} notif={n} onRead={markRead} />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2">
              <button className="text-xs text-primary hover:text-primary/80 transition-colors">
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
