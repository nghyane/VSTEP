import { queryOptions } from "@tanstack/react-query"
import { api, type ApiResponse } from "#/lib/api"

interface Notification {
	id: string
	type: string
	title: string
	body: string | null
	icon_key: string | null
	read_at: string | null
	created_at: string
}

interface NotificationPage {
	data: Notification[]
	total: number
}

export const unreadCountQuery = queryOptions({
	queryKey: ["notifications", "unread-count"],
	queryFn: () => api.get("notifications/unread-count").json<ApiResponse<{ count: number }>>(),
})

export const notificationsQuery = queryOptions({
	queryKey: ["notifications"],
	queryFn: () => api.get("notifications").json<NotificationPage>(),
})

export type { Notification }
