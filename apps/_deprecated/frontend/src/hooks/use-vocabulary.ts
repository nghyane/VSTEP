import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
	PaginatedResponse,
	VocabularyTopic,
	VocabularyTopicDetail,
	VocabularyTopicProgress,
} from "@/types/api"

function useVocabularyTopics(page = 1, limit = 10) {
	return useQuery({
		queryKey: ["vocabulary", "topics", page, limit],
		queryFn: () =>
			api.get<PaginatedResponse<VocabularyTopic>>(
				`/api/vocabulary/topics?page=${page}&limit=${limit}`,
			),
	})
}

function useVocabularyTopic(id: string) {
	return useQuery({
		queryKey: ["vocabulary", "topics", id],
		queryFn: () => api.get<VocabularyTopicDetail>(`/api/vocabulary/topics/${id}`),
		enabled: !!id,
	})
}

function useTopicProgress(topicId: string) {
	return useQuery({
		queryKey: ["vocabulary", "progress", topicId],
		queryFn: () => api.get<VocabularyTopicProgress>(`/api/vocabulary/topics/${topicId}/progress`),
		enabled: !!topicId,
	})
}

function useToggleKnown() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ wordId, known }: { wordId: string; known: boolean }) =>
			api.put<{
				userId: string
				wordId: string
				known: boolean
				lastReviewedAt: string
				createdAt: string
				updatedAt: string
			}>(`/api/vocabulary/words/${wordId}/known`, { known }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["vocabulary"] })
		},
	})
}

function useTopicsProgress(topicIds: string[]) {
	const results = useQueries({
		queries: topicIds.map((id) => ({
			queryKey: ["vocabulary", "progress", id],
			queryFn: () => api.get<VocabularyTopicProgress>(`/api/vocabulary/topics/${id}/progress`),
			enabled: !!id,
			staleTime: 30_000,
		})),
	})

	const progressMap: Record<string, VocabularyTopicProgress> = {}
	for (let i = 0; i < topicIds.length; i++) {
		const result = results[i]
		if (result?.data) {
			progressMap[topicIds[i]] = result.data
		}
	}

	return progressMap
}

export {
	useToggleKnown,
	useTopicProgress,
	useTopicsProgress,
	useVocabularyTopic,
	useVocabularyTopics,
}
