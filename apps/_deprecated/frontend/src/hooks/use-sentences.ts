import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
	PaginatedResponse,
	SentenceTopic,
	SentenceTopicDetail,
	SentenceTopicProgress,
} from "@/types/api"

function useSentenceTopics(page = 1, limit = 20) {
	return useQuery({
		queryKey: ["sentences", "topics", page, limit],
		queryFn: () =>
			api.get<PaginatedResponse<SentenceTopic>>(
				`/api/sentences/topics?page=${page}&limit=${limit}`,
			),
	})
}

function useSentenceTopic(id: string) {
	return useQuery({
		queryKey: ["sentences", "topics", id],
		queryFn: () => api.get<SentenceTopicDetail>(`/api/sentences/topics/${id}`),
		enabled: !!id,
	})
}

function useSentenceTopicProgress(topicId: string) {
	return useQuery({
		queryKey: ["sentences", "progress", topicId],
		queryFn: () => api.get<SentenceTopicProgress>(`/api/sentences/topics/${topicId}/progress`),
		enabled: !!topicId,
	})
}

function useToggleMastered() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ sentenceId, mastered }: { sentenceId: string; mastered: boolean }) =>
			api.put<{
				sentenceId: string
				mastered: boolean
				lastReviewedAt: string
			}>(`/api/sentences/${sentenceId}/mastered`, { mastered }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["sentences"] })
		},
	})
}

export { useSentenceTopic, useSentenceTopicProgress, useSentenceTopics, useToggleMastered }
