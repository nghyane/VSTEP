import { queryOptions } from "@tanstack/react-query"
import type {
	ExamDetail,
	ExamDraft,
	ExamListItem,
	ExamSessionData,
	ExamSessionSummary,
	SessionResultsData,
} from "#/features/exam/types"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"

export { appConfigQuery } from "#/features/config/queries"

export interface ExamsQueryParams {
	q?: string
	status?: "not_started" | "in_progress" | "submitted"
	sort?: "newest" | "popular"
	page?: number
	per_page?: number
}

function examSearchParams(params: ExamsQueryParams): URLSearchParams {
	const searchParams = new URLSearchParams()
	if (params.q) searchParams.set("q", params.q)
	if (params.status) searchParams.set("status", params.status)
	if (params.sort) searchParams.set("sort", params.sort)
	if (params.page) searchParams.set("page", String(params.page))
	if (params.per_page) searchParams.set("per_page", String(params.per_page))
	return searchParams
}

export const examsQuery = (params: ExamsQueryParams = {}) =>
	queryOptions({
		queryKey: ["exams", params],
		queryFn: () =>
			api.get("exams", { searchParams: examSearchParams(params) }).json<PaginatedResponse<ExamListItem>>(),
	})

export const examDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["exams", id],
		queryFn: () => api.get(`exams/${id}`).json<ApiResponse<ExamDetail>>(),
	})

export const mySessionsQuery = queryOptions({
	queryKey: ["exam-sessions", "mine"],
	queryFn: () => api.get("exam-sessions").json<ApiResponse<ExamSessionSummary[]>>(),
	staleTime: 30_000,
})

export const examSessionQuery = (sessionId: string) =>
	queryOptions({
		queryKey: ["exam-sessions", sessionId],
		queryFn: () => api.get(`exam-sessions/${sessionId}`).json<ApiResponse<ExamSessionData>>(),
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
	})

export const sessionResultsQuery = (sessionId: string) =>
	queryOptions({
		queryKey: ["exam-sessions", sessionId, "results"],
		queryFn: () => api.get(`exam-sessions/${sessionId}/results`).json<ApiResponse<SessionResultsData>>(),
		staleTime: 5_000,
		// Writing/Speaking được AI chấm async — BE read-model quyết định còn pending hay không.
		refetchInterval: (query) => {
			const data = query.state.data?.data
			if (!data) return false
			return data.summary.has_pending_ai ? 5_000 : false
		},
	})

export const examDraftQuery = (sessionId: string) =>
	queryOptions({
		queryKey: ["exam-sessions", sessionId, "draft"],
		queryFn: () => api.get(`exam-sessions/${sessionId}/draft`).json<ApiResponse<ExamDraft | null>>(),
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
	})
