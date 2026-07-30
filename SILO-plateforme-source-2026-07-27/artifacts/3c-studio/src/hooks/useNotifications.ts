import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";
import {
  listNotifications,
  markNotificationRead,
  markAllRead,
  subscribeToNotifications,
} from "@/services/notificationService";
import { isSupabaseConfigured } from "@/services/supabaseClient";
import type { Notification } from "@/types";

export function useNotifications() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;
  const notificationsEnabled =
    import.meta.env.VITE_ENABLE_SUPABASE_NOTIFICATIONS === "true";
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(notificationsEnabled);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const load = useCallback(async () => {
    if (!notificationsEnabled || !isLoaded || !userId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await listNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error("[notifications] Chargement impossible", error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, notificationsEnabled, userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Abonnement Realtime
  useEffect(() => {
    if (!notificationsEnabled || !userId || !isSupabaseConfigured) return;
    const unsubscribe = subscribeToNotifications(userId, (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
    });
    return unsubscribe;
  }, [notificationsEnabled, userId]);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!notificationsEnabled || !userId) return;
    await markAllRead(userId);
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
  }, [notificationsEnabled, userId]);

  return { notifications, unreadCount, isLoading, markRead, markAllAsRead, reload: load };
}
