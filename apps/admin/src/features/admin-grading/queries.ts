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
		severity?: "strict" | "standard" | "lenient"
		word_minimum_task1?: number
		word_minimum_task2?: number
		minimum_covered_points?: number
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

export interface SimulateInput {
	part: 1 | 2
	word_count: number
	covered_points: number
	scores?: Record<string, number>
}

export interface SimulateResult {
	assessable: boolean | null
	overall_band: number | null
	criterion_scores: Record<string, { raw: number; capped: number; weight: number }> | null
	caps_applied: Record<string, unknown>
	details: {
		word_check: { passed: boolean; actual: number; required: number }
		coverage_check: { passed: boolean; actual: number; required: number }
		below_official_minimum: boolean
		official_minimum: number
		part: number
		short_response_caps: Array<{ max_words: number; cap: number }>
		task_fulfillment_word_caps: Array<{ max_words: number; cap: number }>
		system_gates: Record<string, { enabled: boolean; description: string }>
	}
	error?: string
}

export function simulateRubric(id: string, input: SimulateInput) {
	return api.post(`admin/grading-rubrics/${id}/simulate`, { json: input }).json<ApiResponse<SimulateResult>>()
}
