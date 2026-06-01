import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
	ExamSession,
	ExamSessionDetail,
	ExamSessionWithExam,
	PaginatedResponse,
	SubmissionAnswer,
} from "@/types/api"

// BE ExamSessionDetailResource returns nested { session, exam, questions, answers, ... }
// FE expects flat ExamSessionDetail (session fields + questions + answers at top level)
interface SessionDetailResponse {
	session: Record<string, unknown>
	exam?: Record<string, unknown>
	questions?: unknown[]
	answers?: unknown[]
	submissions?: unknown[]
	progress?: { answered: number; total: number }
}

function flattenSessionDetail(raw: unknown): ExamSessionDetail {
	const res = raw as SessionDetailResponse
	if (res?.session) {
		return {
			...res.session,
			questions: res.questions ?? [],
			answers: res.answers ?? [],
			submissions: res.submissions ?? [],
		} as unknown as ExamSessionDetail
	}
	// Already flat (shouldn't happen, but safe fallback)
	return raw as ExamSessionDetail
}

function useExamDetail(examId: string) {
	return useQuery({
		queryKey: ["exams", examId],
		queryFn: () => api.get<import("@/types/api").Exam>(`/api/exams/${examId}`),
		enabled: !!examId,
	})
}

function useStartExam() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: async (examId: string) => {
			const raw = await api.post<unknown>(`/api/exams/${examId}/start`)
			return flattenSessionDetail(raw) as unknown as ExamSession
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["exams"] })
		},
	})
}

const GRADING_POLL_MS = 5_000

function hasGradingInProgress(data: ExamSessionDetail | undefined): boolean {
	if (!data?.submissions?.length) return false
	return data.submissions.some((s) => s.status === "pending" || s.status === "processing")
}

function useExamSession(sessionId: string) {
	const result = useQuery({
		queryKey: ["exam-sessions", sessionId],
		queryFn: async () => {
			const raw = await api.get<unknown>(`/api/sessions/${sessionId}`)
			return flattenSessionDetail(raw)
		},
		refetchInterval: (query) => (hasGradingInProgress(query.state.data) ? GRADING_POLL_MS : false),
	})
	return result
}

interface UseExamSessionsParams {
	page?: number
	limit?: number
	status?: ExamSession["status"]
}

function useExamSessions(params: UseExamSessionsParams = {}) {
	const { page = 1, limit = 20, status } = params
	const search = new URLSearchParams()
	search.set("page", String(page))
	search.set("limit", String(limit))
	if (status) search.set("status", status)

	return useQuery({
		queryKey: ["exam-sessions", { page, limit, status }],
		queryFn: () => api.get<PaginatedResponse<ExamSessionWithExam>>(`/api/sessions?${search}`),
	})
}

function useSaveAnswers(sessionId: string) {
	return useMutation({
		mutationFn: (answers: { questionId: string; answer: SubmissionAnswer }[]) =>
			api.put<{ success: boolean; saved: number }>(`/api/sessions/${sessionId}`, { answers }),
	})
}

function useAnswerQuestion(sessionId: string) {
	return useMutation({
		mutationFn: (body: { questionId: string; answer: SubmissionAnswer }) =>
			api.post<{ success: boolean }>(`/api/sessions/${sessionId}/answer`, body),
	})
}

function useSubmitExam(sessionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: async () => {
			const raw = await api.post<unknown>(`/api/sessions/${sessionId}/submit`)
			return flattenSessionDetail(raw) as unknown as ExamSession
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["exam-sessions", sessionId] })
			qc.invalidateQueries({ queryKey: ["progress"] })
		},
	})
}

export {
	useAnswerQuestion,
	useExamSessions,
	useExamDetail,
	useExamSession,
	useSaveAnswers,
	useStartExam,
	useSubmitExam,
}
