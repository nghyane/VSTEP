import { queryOptions } from "@tanstack/react-query"
import { type ApiResponse, api } from "#/lib/api"
import type { SrsQueueResponse, TopicDetailResponse, VocabTopic } from "#/features/vocab/types"

export const vocabTopicsQuery = queryOptions({
	queryKey: ["vocab", "topics"],
	queryFn: () => api.get("vocab/topics").json<ApiResponse<VocabTopic[]>>(),
})

export const vocabSrsQueueQuery = queryOptions({
	queryKey: ["vocab", "srs", "queue"],
	queryFn: () => api.get("vocab/srs/queue").json<ApiResponse<SrsQueueResponse>>(),
})

export const vocabTopicDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["vocab", "topics", id],
		queryFn: () => api.get(`vocab/topics/${id}`).json<ApiResponse<TopicDetailResponse>>(),
	})
