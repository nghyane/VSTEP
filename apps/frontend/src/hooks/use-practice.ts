import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
	PaginatedResponse,
	PracticeMode,
	PracticeStartResponse,
	PracticeSubmitResponse,
	Question,
	QuestionLevel,
	Skill,
	SubmissionFull,
} from "@/types/api"

interface UsePracticeQuestionsParams {
	skill: Skill
	level?: string
	part?: number
	topic?: string
	search?: string
}

function usePracticeQuestions(params: UsePracticeQuestionsParams) {
	const qs = new URLSearchParams({ skill: params.skill, per_page: "100" })
	if (params.level) qs.set("level", params.level)
	if (params.part != null) qs.set("part", String(params.part))
	if (params.topic) qs.set("topic", params.topic)
	if (params.search) qs.set("search", params.search)

	return useQuery({
		queryKey: ["practice", "questions", params],
		queryFn: () => api.get<PaginatedResponse<Question>>(`/api/practice/questions?${qs}`),
	})
}

function useStartPractice() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (params: {
			skill: Skill
			mode: PracticeMode
			level?: QuestionLevel
			itemsCount?: number
			part?: number
			topic?: string
		}) => api.post<PracticeStartResponse>("/api/practice/sessions", params),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["practice", "sessions"] })
		},
	})
}

function useSubmitPracticeAnswer(sessionId: string) {
	return useMutation({
		mutationFn: (body: { questionId: string; answer: { text: string } }) =>
			api.post<PracticeSubmitResponse>(`/api/practice/sessions/${sessionId}/submit`, body),
	})
}

function useCompletePractice(sessionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: () => api.post<unknown>(`/api/practice/sessions/${sessionId}/complete`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["practice", "sessions"] })
			qc.invalidateQueries({ queryKey: ["progress"] })
		},
	})
}

interface PracticeSessionShowResponse {
	session: import("@/types/api").PracticeSession
	currentItem: import("@/types/api").PracticeItem | null
	progress: { current: number; total: number; hasMore: boolean }
	writingTier: import("@/types/api").WritingTier | null
}

function usePracticeSession(sessionId: string | null) {
	return useQuery({
		queryKey: ["practice", "sessions", sessionId],
		queryFn: () => api.get<PracticeSessionShowResponse>(`/api/practice/sessions/${sessionId}`),
		enabled: !!sessionId,
	})
}

const GRADING_POLL_MS = 5_000

function useSubmission(submissionId: string | null) {
	return useQuery({
		queryKey: ["submissions", submissionId],
		queryFn: () => api.get<SubmissionFull>(`/api/submissions/${submissionId}`),
		enabled: !!submissionId,
		refetchInterval: (query) => {
			const status = query.state.data?.status
			if (!status) return GRADING_POLL_MS
			return status === "pending" || status === "processing" ? GRADING_POLL_MS : false
		},
	})
}

export {
	useCompletePractice,
	usePracticeQuestions,
	usePracticeSession,
	useStartPractice,
	useSubmission,
	useSubmitPracticeAnswer,
}
