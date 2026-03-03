import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { ExamSession, SubmissionAnswer } from "@/types/api"

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
		queryFn: () => api.get<ExamSession>(`/api/exams/sessions/${sessionId}`),
	})
}

function useSaveAnswers(sessionId: string) {
	return useMutation({
		mutationFn: (answers: { questionId: string; answer: SubmissionAnswer }[]) =>
			api.put<{ success: boolean; saved: number }>(`/api/exams/sessions/${sessionId}`, { answers }),
	})
}

function useAnswerQuestion(sessionId: string) {
	return useMutation({
		mutationFn: (body: { questionId: string; answer: SubmissionAnswer }) =>
			api.post<{ success: boolean }>(`/api/exams/sessions/${sessionId}/answer`, body),
	})
}

function useSubmitExam(sessionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: () => api.post<ExamSession>(`/api/exams/sessions/${sessionId}/submit`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["exam-sessions", sessionId] })
			qc.invalidateQueries({ queryKey: ["progress"] })
		},
	})
}

export {
	useAnswerQuestion,
	useExamDetail,
	useExamSession,
	useSaveAnswers,
	useStartExam,
	useSubmitExam,
}
