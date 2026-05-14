import { queryOptions } from "@tanstack/react-query"
import type {
	AdminGrammarPoint,
	AdminGrammarPointDetail,
	ListPointsFilters,
} from "#/features/admin-grammar/types"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"

export function buildPointListSearch(filters: ListPointsFilters): string {
	const params = new URLSearchParams()
	if (filters.page) params.set("page", String(filters.page))
	if (filters.per_page) params.set("per_page", String(filters.per_page))
	if (filters.q) params.set("q", filters.q)
	if (filters.is_published === "yes") params.set("is_published", "1")
	if (filters.is_published === "no") params.set("is_published", "0")
	if (filters.category) params.set("category", filters.category)
	const qs = params.toString()
	return qs ? `?${qs}` : ""
}

export const adminGrammarPointsQuery = (filters: ListPointsFilters) =>
	queryOptions({
		queryKey: ["admin", "grammar", "points", filters],
		queryFn: () =>
			api
				.get(`admin/grammar/points${buildPointListSearch(filters)}`)
				.json<PaginatedResponse<AdminGrammarPoint>>(),
		staleTime: 30_000,
	})

export const adminGrammarPointDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["admin", "grammar", "points", "detail", id],
		queryFn: () => api.get(`admin/grammar/points/${id}`).json<ApiResponse<AdminGrammarPointDetail>>(),
	})
