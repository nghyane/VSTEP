// Notification store — local cache backed by API
// getSnapshot luôn trả stable reference (module-level variables)
import { useSyncExternalStore } from "react";
import { api } from "@/lib/api";

export interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  iconKey: string;
  readAt: string | null;
  createdAt: string;
}

let notifications: AppNotification[] = [];
let unreadCount = 0; // pre-computed, tránh .filter() trong getSnapshot
const listeners = new Set<() => void>();

function notify() { listeners.forEach((l) => l()); }

function recount() {
  unreadCount = notifications.filter((n) => !n.readAt).length;
}

export async function loadNotifications() {
  try {
    const res = await api.get<{ data: { id: string; title: string; body: string | null; read_at: string | null; created_at: string }[] } | null>("/api/v1/notifications");
    if (res?.data) {
      notifications = res.data.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        iconKey: "notification",
        readAt: n.read_at,
        createdAt: n.created_at,
      }));
      recount();
      notify();
    }
  } catch {
    // API not available yet — keep empty
    notifications = [];
    unreadCount = 0;
  }
}

export function syncNotifications(items: AppNotification[]) {
  notifications = items;
  recount();
  notify();
}

export function addNotification(n: Omit<AppNotification, "id" | "readAt" | "createdAt">) {
  notifications = [
    { ...n, id: Math.random().toString(36).slice(2), readAt: null, createdAt: new Date().toISOString() },
    ...notifications,
  ];
  recount();
  notify();
}

export function markAllRead() {
  const now = new Date().toISOString();
  notifications = notifications.map((n) => ({ ...n, readAt: n.readAt ?? now }));
  recount();
  notify();
}

export function clearNotifications() {
  notifications = [];
  unreadCount = 0;
  notify();
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export function useNotifications() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => notifications, // stable array reference, chỉ thay đổi khi mutate
  );
}

export function useUnreadCount() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => unreadCount, // số nguyên — luôn stable
  );
}
