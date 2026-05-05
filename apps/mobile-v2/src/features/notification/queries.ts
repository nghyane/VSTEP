import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { PaginatedNotifications, ReadAllResult, ReadNotificationResult, UnreadCount } from "@/features/notification/types";

export const unreadCountQuery = {
  queryKey: ["notifications", "unread-count"] as const,
  queryFn: () => api.get<UnreadCount>("/api/v1/notifications/unread-count"),
};

export const notificationsQuery = {
  queryKey: ["notifications"] as const,
  queryFn: () => api.get<PaginatedNotifications>("/api/v1/notifications"),
};

export function useUnreadCount() {
  return useQuery(unreadCountQuery);
}

export function useNotifications() {
  return useQuery(notificationsQuery);
}

export function useMarkAllRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<ReadAllResult>("/api/v1/notifications/read-all"),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      void qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post<ReadNotificationResult>(`/api/v1/notifications/${id}/read`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      void qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<Record<string, never>>(`/api/v1/notifications/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      void qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });
}
