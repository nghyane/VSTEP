import { queryOptions } from "@tanstack/react-query"
import type {
	AppConfig,
	Exam,
	ExamDetail,
	ExamDraft,
	ExamSessionData,
	ExamSessionSummary,
	SessionResultsData,
} from "#/features/exam/types"
import { type ApiResponse, api } from "#/lib/api"

export const appConfigQuery = queryOptions({
	queryKey: ["config"],
	queryFn: () => api.get("config").json<ApiResponse<AppConfig>>(),
	staleTime: 5 * 60 * 1000,
})

export const examsQuery = queryOptions({
	queryKey: ["exams"],
	queryFn: () => api.get("exams").json<ApiResponse<Exam[]>>(),
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
		staleTime: 60_000,
	})

export const examDraftQuery = (sessionId: string) =>
	queryOptions({
		queryKey: ["exam-sessions", sessionId, "draft"],
		queryFn: () => api.get(`exam-sessions/${sessionId}/draft`).json<ApiResponse<ExamDraft | null>>(),
		staleTime: Number.POSITIVE_INFINITY,
		retry: false,
	})
