import { queryOptions } from "@tanstack/react-query"
import type { GradingRubric } from "#/features/admin-grading/types"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"

export interface RubricListFilters {
	skill?: string | null
	is_active?: string | null
	page?: number
}

function buildSearch(filters: RubricListFilters): string {
	const params = new URLSearchParams()
	if (filters.page) params.set("page", String(filters.page))
	if (filters.skill) params.set("skill", filters.skill)
	if (filters.is_active === "yes") params.set("is_active", "1")
	if (filters.is_active === "no") params.set("is_active", "0")
	const qs = params.toString()
	return qs ? `?${qs}` : ""
}

export const rubricListQuery = (filters: RubricListFilters) =>
	queryOptions({
		queryKey: ["admin", "grading-rubrics", "list", filters],
		queryFn: () =>
			api.get(`admin/grading-rubrics${buildSearch(filters)}`).json<PaginatedResponse<GradingRubric>>(),
		staleTime: 60_000,
	})

export const rubricDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["admin", "grading-rubrics", "detail", id],
		queryFn: () => api.get(`admin/grading-rubrics/${id}`).json<ApiResponse<GradingRubric>>(),
		staleTime: 60_000,
	})

export interface UpdateRubricPayload {
	name?: string
	effective_from?: string
	policy?: {
		assessment_gates?: {
			severe_minimum_words_task1?: number
			severe_minimum_words_task2?: number
			minimum_covered_points?: number
		}
		word_rules?: {
			official_minimum_task1?: number
			official_minimum_task2?: number
			short_response_caps?: Array<{ max_words: number; cap: number }>
			task_fulfillment_word_caps?: Array<{ max_words: number; cap: number }>
		}
	}
}

export function updateRubric(id: string, payload: UpdateRubricPayload) {
	return api.patch(`admin/grading-rubrics/${id}`, { json: payload }).json<ApiResponse<GradingRubric>>()
}

export function cloneRubric(id: string) {
	return api.post(`admin/grading-rubrics/${id}/clone`).json<ApiResponse<GradingRubric>>()
}

export function activateRubric(id: string) {
	return api.post(`admin/grading-rubrics/${id}/activate`).json<ApiResponse<GradingRubric>>()
}
