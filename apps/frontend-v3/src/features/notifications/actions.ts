import type { ReadAllResult } from "#/features/notifications/types"
import { type ApiResponse, api } from "#/lib/api"

export async function readAllNotifications() {
	return api.post("notifications/read-all").json<ApiResponse<ReadAllResult>>()
}
