import { useQuery, useMutation } from "@tanstack/react-query";
import { MOCK_NOTIFICATIONS } from "@/lib/mock";
import type { Notification, PaginatedResponse } from "@/types/api";

export function useNotifications(_page = 1, _unreadOnly = false) {
  return useQuery({ queryKey: ["notifications", _page], queryFn: async (): Promise<PaginatedResponse<Notification>> => ({ data: MOCK_NOTIFICATIONS, meta: { page: 1, limit: 20, total: MOCK_NOTIFICATIONS.length, totalPages: 1 } }) });
}

export function useUnreadCount() {
  return useQuery({ queryKey: ["notifications-unread"], queryFn: async () => ({ count: MOCK_NOTIFICATIONS.filter((n) => !n.readAt).length }) });
}

export function useMarkRead() {
  return useMutation({ mutationFn: async (_id: string) => ({ id: _id }) });
}

export function useMarkAllRead() {
  return useMutation({ mutationFn: async () => ({ updated: 0 }) });
}
