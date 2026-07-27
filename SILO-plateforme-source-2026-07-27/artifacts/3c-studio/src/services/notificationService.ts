/**
 * notificationService — Notifications internes + Realtime
 */
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  AlertTriangle,
  AtSign,
  CreditCard,
  FileText,
  Film,
  Folder,
  MessageSquare,
  Package,
  Receipt,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { Notification, NotificationType } from "@/types";

export async function listNotifications(userId: string, limit = 20): Promise<Notification[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []).map(mapNotification);
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId);
}

export async function markAllRead(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_read", false);
}

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  projectId?: string;
}): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    data: params.data,
    project_id: params.projectId,
  });
}

// Realtime notifications
let notifChannel: RealtimeChannel | null = null;

export function subscribeToNotifications(
  userId: string,
  onNotification: (n: Notification) => void
): () => void {
  if (!isSupabaseConfigured || !supabase) return () => {};

  notifChannel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => onNotification(mapNotification(payload.new as Record<string, unknown>))
    )
    .subscribe();

  return () => {
    notifChannel?.unsubscribe();
    notifChannel = null;
  };
}

// ---- MAPPER ----

function mapNotification(raw: Record<string, unknown>): Notification {
  return {
    id: raw.id as string,
    userId: raw.user_id as string,
    type: raw.type as NotificationType,
    title: raw.title as string,
    body: raw.body as string | undefined,
    data: raw.data as Record<string, unknown> | undefined,
    projectId: raw.project_id as string | undefined,
    isRead: (raw.is_read as boolean) ?? false,
    readAt: raw.read_at as string | undefined,
    createdAt: raw.created_at as string,
  };
}

// ---- ICON / CONFIG ----

export const NOTIFICATION_CONFIG: Record<
  NotificationType,
  { icon: LucideIcon; color: string }
> = {
  project_created: { icon: Film, color: "text-blue-400" },
  project_updated: { icon: RefreshCw, color: "text-violet-400" },
  status_changed: { icon: RefreshCw, color: "text-violet-400" },
  message_received: { icon: MessageSquare, color: "text-slate-400" },
  file_uploaded: { icon: Folder, color: "text-cyan-400" },
  quote_sent: { icon: FileText, color: "text-yellow-400" },
  quote_accepted: { icon: FileText, color: "text-emerald-400" },
  invoice_sent: { icon: Receipt, color: "text-orange-400" },
  payment_received: { icon: CreditCard, color: "text-emerald-400" },
  delivery_ready: { icon: Package, color: "text-teal-400" },
  correction_requested: { icon: AlertTriangle, color: "text-amber-400" },
  mention: { icon: AtSign, color: "text-pink-400" },
};
