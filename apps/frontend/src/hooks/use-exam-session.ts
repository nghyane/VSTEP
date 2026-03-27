import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
	ExamSession,
	ExamSessionDetail,
	ExamSessionWithExam,
	PaginatedResponse,
	SubmissionAnswer,
} from "@/types/api"

function useExamDetail(examId: string) {
	return useQuery({
		queryKey: ["exams", examId],
		queryFn: () => api.get<import("@/types/api").Exam>(`/api/exams/${examId}`),
	})
}

function useStartExam() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (examId: string) => api.post<ExamSession>(`/api/exams/${examId}/start`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["exams"] })
		},
	})
}

function useExamSession(sessionId: string) {
	return useQuery({
		queryKey: ["exam-sessions", sessionId],
		queryFn: () => api.get<ExamSessionDetail>(`/api/sessions/${sessionId}`),
	})
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
		mutationFn: () => api.post<ExamSession>(`/api/sessions/${sessionId}/submit`),
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
