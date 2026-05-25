import { queryOptions } from "@tanstack/react-query"
import type { AdminExam, ListExamsFilters } from "#/features/admin-exams/types"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"

function buildExamListSearch(filters: ListExamsFilters): string {
	const params = new URLSearchParams()
	if (filters.page) params.set("page", String(filters.page))
	if (filters.per_page) params.set("per_page", String(filters.per_page))
	if (filters.q) params.set("q", filters.q)
	if (filters.is_published === "yes") params.set("is_published", "1")
	if (filters.is_published === "no") params.set("is_published", "0")
	const qs = params.toString()
	return qs ? `?${qs}` : ""
}

export const adminExamsQuery = (filters: ListExamsFilters) =>
	queryOptions({
		queryKey: ["admin", "exams", filters],
		queryFn: () => api.get(`admin/exams${buildExamListSearch(filters)}`).json<PaginatedResponse<AdminExam>>(),
		staleTime: 30_000,
	})

export const adminExamDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["admin", "exams", "detail", id],
		queryFn: () => api.get(`admin/exams/${id}`).json<ApiResponse<AdminExam>>(),
	})
