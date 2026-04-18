import { queryOptions } from "@tanstack/react-query"
import { mockFetchSpeaking, mockFetchSpeakingExercise } from "#/lib/mock/speaking"

export const speakingKeys = {
	all: ["speaking"] as const,
	list: () => [...speakingKeys.all, "list"] as const,
	exercise: (id: string) => [...speakingKeys.all, "exercise", id] as const,
}

export const speakingListQueryOptions = () =>
	queryOptions({
		queryKey: speakingKeys.list(),
		queryFn: mockFetchSpeaking,
		staleTime: 1000 * 60 * 5,
	})

export const speakingExerciseQueryOptions = (id: string) =>
	queryOptions({
		queryKey: speakingKeys.exercise(id),
		queryFn: () => mockFetchSpeakingExercise(id),
		staleTime: 1000 * 60 * 5,
	})
