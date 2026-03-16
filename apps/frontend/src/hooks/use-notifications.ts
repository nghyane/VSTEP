import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { NotificationItem, PaginatedResponse } from "@/types/api"

function useNotifications(params?: { page?: number; unreadOnly?: boolean }) {
	const searchParams = new URLSearchParams()
	if (params?.page) searchParams.set("page", String(params.page))
	if (params?.unreadOnly) searchParams.set("unreadOnly", "true")
	const qs = searchParams.toString()

	return useQuery({
		queryKey: ["notifications", params],
		queryFn: () =>
			api.get<PaginatedResponse<NotificationItem>>(`/api/notifications${qs ? `?${qs}` : ""}`),
	})
}

function useUnreadCount() {
	return useQuery({
		queryKey: ["notifications", "unread-count"],
		queryFn: () => api.get<{ count: number }>("/api/notifications/unread-count"),
		refetchInterval: 30000,
	})
}

function useMarkRead() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.post<{ id: string }>(`/api/notifications/${id}/read`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["notifications"] })
		},
	})
}

function useMarkAllRead() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: () => api.post<{ updated: number }>("/api/notifications/read-all"),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["notifications"] })
		},
	})
}

export { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount }
