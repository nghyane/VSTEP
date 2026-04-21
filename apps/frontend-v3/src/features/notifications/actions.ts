import { type ApiResponse, api } from "#/lib/api"
import type { ReadAllResult } from "#/features/notifications/types"

export async function readAllNotifications() {
	return api.post("notifications/read-all").json<ApiResponse<ReadAllResult>>()
}
