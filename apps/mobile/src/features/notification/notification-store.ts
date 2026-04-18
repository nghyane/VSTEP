// Notification store — aligned with frontend-v2 notification/lib/store.ts
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

export type NotificationIcon = "fire" | "coin" | "trophy";

export interface AppNotification {
  readonly id: string;
  readonly title: string;
  readonly body?: string;
  readonly iconKey: NotificationIcon;
  readonly createdAt: number;
  readonly readAt: number | null;
}

const STORAGE_KEY = "vstep:notifications:v1";
const MAX_KEEP = 30;

let list: AppNotification[] = [];
const listeners = new Set<() => void>();

function emit() {
  SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(list)).catch(() => {});
  for (const fn of listeners) fn();
}

export async function loadNotifications(): Promise<void> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) list = parsed.filter((n: any) => n?.id && n?.title && n?.createdAt);
    for (const fn of listeners) fn();
  } catch {}
}

export function useNotifications(): readonly AppNotification[] {
  const [val, setVal] = useState<readonly AppNotification[]>(list);
  useEffect(() => {
    const fn = () => setVal([...list]);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return val;
}

export function useUnreadCount(): number {
  const items = useNotifications();
  return items.reduce((n, x) => n + (x.readAt === null ? 1 : 0), 0);
}

export function pushNotification(input: { id: string; title: string; body?: string; iconKey: NotificationIcon }): boolean {
  if (list.some((n) => n.id === input.id)) return false;
  list = [{ ...input, createdAt: Date.now(), readAt: null }, ...list].slice(0, MAX_KEEP);
  emit();
  return true;
}

export function markAllRead(): void {
  let changed = false;
  const now = Date.now();
  list = list.map((n) => {
    if (n.readAt !== null) return n;
    changed = true;
    return { ...n, readAt: now };
  });
  if (changed) emit();
}

export function clearNotifications(): void {
  if (list.length === 0) return;
  list = [];
  emit();
}

export function formatRelative(ts: number): string {
  const diffMin = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} giờ trước`;
  const diffD = Math.floor(diffH / 24);
  return diffD < 7 ? `${diffD} ngày trước` : `${String(new Date(ts).getDate()).padStart(2, "0")}/${String(new Date(ts).getMonth() + 1).padStart(2, "0")}`;
}
