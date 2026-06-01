import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
	PaginatedResponse,
	Question,
	QuestionContent,
	QuestionWithKnowledgePoints,
} from "@/types/api"

function useAdminQuestions(params?: {
	page?: number
	skill?: string
	part?: number
	search?: string
}) {
	const sp = new URLSearchParams()
	if (params?.page) sp.set("page", String(params.page))
	if (params?.skill) sp.set("skill", params.skill)
	if (params?.part) sp.set("part", String(params.part))
	if (params?.search) sp.set("search", params.search)
	const qs = sp.toString()
	return useQuery({
		queryKey: ["admin-questions", params],
		queryFn: () => api.get<PaginatedResponse<Question>>(`/api/questions${qs ? `?${qs}` : ""}`),
	})
}

function useAdminQuestion(id: string) {
	return useQuery({
		queryKey: ["admin-questions", id],
		queryFn: () => api.get<QuestionWithKnowledgePoints>(`/api/questions/${id}`),
		enabled: !!id,
	})
}

function useCreateQuestion() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (body: {
			skill: string
			part: number
			content: QuestionContent
			answerKey?: { correctAnswers: Record<string, string> }
			explanation?: string
			knowledgePointIds?: string[]
		}) => api.post<QuestionWithKnowledgePoints>("/api/questions", body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin-questions"] })
		},
	})
}

function useUpdateQuestion() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({
			id,
			...body
		}: {
			id: string
			part?: number
			content?: QuestionContent
			answerKey?: { correctAnswers: Record<string, string> }
			explanation?: string
			isActive?: boolean
			level?: string
			knowledgePointIds?: string[]
		}) => api.patch<QuestionWithKnowledgePoints>(`/api/questions/${id}`, body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin-questions"] })
		},
	})
}

function useDeleteQuestion() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete<{ id: string }>(`/api/questions/${id}`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin-questions"] })
		},
	})
}

export {
	useAdminQuestion,
	useAdminQuestions,
	useCreateQuestion,
	useDeleteQuestion,
	useUpdateQuestion,
}
