import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import type { Notification, PaginatedResponse } from "@/types/api";

export function useNotifications(page = 1, unreadOnly = false) {
  const search = new URLSearchParams();
  search.set("page", String(page));
  if (unreadOnly) search.set("unreadOnly", "true");

  return useQuery({
    queryKey: ["notifications", page, unreadOnly],
    queryFn: () => api.get<PaginatedResponse<Notification>>(`/api/notifications?${search.toString()}`),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () => api.get<{ count: number }>("/api/notifications/unread-count"),
    refetchInterval: 30000,
  });
}

export function useMarkRead() {
  return useMutation({
    mutationFn: (id: string) => api.post<{ id: string }>(`/api/notifications/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
}

export function useMarkAllRead() {
  return useMutation({
    mutationFn: () => api.post<{ updated: number }>("/api/notifications/read-all", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });
}
