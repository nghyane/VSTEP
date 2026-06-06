import { queryOptions } from "@tanstack/react-query"
import type {
	AssignTeacherGradingInput,
	SubmitTeacherGradingInput,
	TeacherGradingListFilters,
	TeacherGradingRequestItem,
} from "#/features/teacher-grading/types"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"

function buildSearch(filters: TeacherGradingListFilters): string {
	const params = new URLSearchParams()
	if (filters.page) params.set("page", String(filters.page))
	if (filters.per_page) params.set("per_page", String(filters.per_page))
	if (filters.status && filters.status !== "all") params.set("status", filters.status)
	if (filters.teacher_id) params.set("teacher_id", filters.teacher_id)
	if (filters.skill && filters.skill !== "all") params.set("skill", filters.skill)
	const qs = params.toString()
	return qs ? `?${qs}` : ""
}

export const adminTeacherGradingRequestsQuery = (filters: TeacherGradingListFilters) =>
	queryOptions({
		queryKey: ["admin", "teacher-grading-requests", "list", filters],
		queryFn: () =>
			api
				.get(`admin/teacher-grading-requests${buildSearch(filters)}`)
				.json<PaginatedResponse<TeacherGradingRequestItem>>(),
		staleTime: 30_000,
	})

export const adminTeacherGradingRequestDetailQuery = (requestId: string) =>
	queryOptions({
		queryKey: ["admin", "teacher-grading-requests", "detail", requestId],
		queryFn: () =>
			api.get(`admin/teacher-grading-requests/${requestId}`).json<ApiResponse<TeacherGradingRequestItem>>(),
	})

export const teacherGradingRequestsQuery = (filters: TeacherGradingListFilters) =>
	queryOptions({
		queryKey: ["teacher", "grading-requests", "list", filters],
		queryFn: () =>
			api
				.get(`teacher/grading-requests${buildSearch(filters)}`)
				.json<PaginatedResponse<TeacherGradingRequestItem>>(),
		staleTime: 30_000,
	})

export const teacherGradingRequestDetailQuery = (requestId: string) =>
	queryOptions({
		queryKey: ["teacher", "grading-requests", "detail", requestId],
		queryFn: () =>
			api.get(`teacher/grading-requests/${requestId}`).json<ApiResponse<TeacherGradingRequestItem>>(),
	})

export function assignTeacherGradingRequest(requestId: string, input: AssignTeacherGradingInput) {
	return api
		.post(`admin/teacher-grading-requests/${requestId}/assign`, { json: input })
		.json<ApiResponse<TeacherGradingRequestItem>>()
}

export function rejectTeacherGradingRequest(requestId: string, staffNote?: string) {
	return api
		.post(`admin/teacher-grading-requests/${requestId}/reject`, { json: { staff_note: staffNote } })
		.json<ApiResponse<TeacherGradingRequestItem>>()
}

export function startTeacherGradingRequest(requestId: string) {
	return api
		.post(`teacher/grading-requests/${requestId}/start`)
		.json<ApiResponse<TeacherGradingRequestItem>>()
}

export function submitTeacherGradingRequest(requestId: string, input: SubmitTeacherGradingInput) {
	return api
		.post(`teacher/grading-requests/${requestId}/submit`, { json: input })
		.json<ApiResponse<TeacherGradingRequestItem>>()
}
