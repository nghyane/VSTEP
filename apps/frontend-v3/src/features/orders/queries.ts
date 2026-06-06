import { queryOptions } from "@tanstack/react-query"
import type { OrderHistoryItem } from "#/features/orders/types"
import { api, type PaginatedResponse } from "#/lib/api"

export function orderHistoryQuery(page: number) {
	return queryOptions({
		queryKey: ["orders", "history", page],
		queryFn: () =>
			api.get("me/orders", { searchParams: { page } }).json<PaginatedResponse<OrderHistoryItem>>(),
	})
}
