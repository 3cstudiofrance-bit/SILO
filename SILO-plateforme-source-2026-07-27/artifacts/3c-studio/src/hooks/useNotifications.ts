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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const load = useCallback(async () => {
    if (!isLoaded || !user) return;
    setIsLoading(true);
    const data = await listNotifications(user.id);
    setNotifications(data);
    setIsLoading(false);
  }, [isLoaded, user]);

  useEffect(() => {
    load();
  }, [load]);

  // Abonnement Realtime
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    const unsubscribe = subscribeToNotifications(user.id, (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
    });
    return unsubscribe;
  }, [user]);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await markAllRead(user.id);
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
  }, [user]);

  return { notifications, unreadCount, isLoading, markRead, markAllAsRead, reload: load };
}
