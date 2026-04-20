// Notification hooks — server-side notifications
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ApiResponse, api } from "@/lib/api";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<ApiResponse<any[]>>("notifications"),
    staleTime: 30_000,
  });
}

export function useUnreadCount() {
  const { data } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => api.get<ApiResponse<{ count: number }>>("notifications/unread-count"),
    staleTime: 30_000,
  });
  return data?.data.count ?? 0;
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
