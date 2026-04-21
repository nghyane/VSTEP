import { queryOptions } from "@tanstack/react-query"
import type { Notification, UnreadCount } from "#/features/notifications/types"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"

export const unreadCountQuery = queryOptions({
	queryKey: ["notifications", "unread-count"],
	queryFn: () => api.get("notifications/unread-count").json<ApiResponse<UnreadCount>>(),
})

export const notificationsQuery = queryOptions({
	queryKey: ["notifications"],
	queryFn: () => api.get("notifications").json<PaginatedResponse<Notification>>(),
})
