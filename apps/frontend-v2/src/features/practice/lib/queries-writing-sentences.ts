import { queryOptions } from "@tanstack/react-query"
import {
	mockFetchWritingSentenceTopic,
	mockFetchWritingSentenceTopics,
} from "#/mocks/writing-sentences"

export const writingSentenceKeys = {
	all: ["writing-sentences"] as const,
	list: () => [...writingSentenceKeys.all, "list"] as const,
	topic: (id: string) => [...writingSentenceKeys.all, "topic", id] as const,
}

export const writingSentenceTopicsQueryOptions = () =>
	queryOptions({
		queryKey: writingSentenceKeys.list(),
		queryFn: mockFetchWritingSentenceTopics,
		staleTime: 1000 * 60 * 5,
	})

export const writingSentenceTopicQueryOptions = (id: string) =>
	queryOptions({
		queryKey: writingSentenceKeys.topic(id),
		queryFn: () => mockFetchWritingSentenceTopic(id),
		staleTime: 1000 * 60 * 5,
	})
