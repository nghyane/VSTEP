import { queryOptions } from "@tanstack/react-query"
import type {
	AdminVocabTopic,
	AdminVocabTopicDetail,
	AdminVocabWord,
	ListTopicsFilters,
} from "#/features/admin-vocab/types"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"

export function buildTopicListSearch(filters: ListTopicsFilters): string {
	const params = new URLSearchParams()
	if (filters.page) params.set("page", String(filters.page))
	if (filters.per_page) params.set("per_page", String(filters.per_page))
	if (filters.q) params.set("q", filters.q)
	if (filters.is_published === "yes") params.set("is_published", "1")
	if (filters.is_published === "no") params.set("is_published", "0")
	if (filters.level) params.set("level", filters.level)
	const qs = params.toString()
	return qs ? `?${qs}` : ""
}

export const adminVocabTopicsQuery = (filters: ListTopicsFilters) =>
	queryOptions({
		queryKey: ["admin", "vocab", "topics", filters],
		queryFn: () =>
			api
				.get(`admin/vocab/topics${buildTopicListSearch(filters)}`)
				.json<PaginatedResponse<AdminVocabTopic>>(),
		staleTime: 30_000,
	})

export const adminVocabTopicDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["admin", "vocab", "topics", "detail", id],
		queryFn: () => api.get(`admin/vocab/topics/${id}`).json<ApiResponse<AdminVocabTopicDetail>>(),
	})

export const adminVocabTopicWordsQuery = (id: string) =>
	queryOptions({
		queryKey: ["admin", "vocab", "topics", id, "words"],
		queryFn: () => api.get(`admin/vocab/topics/${id}/words`).json<ApiResponse<AdminVocabWord[]>>(),
	})
