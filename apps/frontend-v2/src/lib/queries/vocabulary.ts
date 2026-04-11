// queryOptions factory cho vocabulary.
// Khi nối API thật: thay queryFn → apiFetchTopics/apiFetchTopic, xóa mock imports.

import { queryOptions } from "@tanstack/react-query"
import { mockFetchTopic, mockFetchTopics } from "#/lib/mock/vocabulary"

export const vocabularyKeys = {
	all: ["vocabulary"] as const,
	topics: () => [...vocabularyKeys.all, "topics"] as const,
	topic: (topicId: string) => [...vocabularyKeys.all, "topic", topicId] as const,
}

export const vocabularyTopicsQueryOptions = () =>
	queryOptions({
		queryKey: vocabularyKeys.topics(),
		queryFn: mockFetchTopics,
		staleTime: 1000 * 60 * 5,
	})

export const vocabularyTopicQueryOptions = (topicId: string) =>
	queryOptions({
		queryKey: vocabularyKeys.topic(topicId),
		queryFn: () => mockFetchTopic(topicId),
		staleTime: 1000 * 60 * 5,
	})
