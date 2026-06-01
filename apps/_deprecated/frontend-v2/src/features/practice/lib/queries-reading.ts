// queryOptions factory cho reading.

import { queryOptions } from "@tanstack/react-query"
import { mockFetchReading, mockFetchReadingExercise } from "#/mocks/reading"

export const readingKeys = {
	all: ["reading"] as const,
	list: () => [...readingKeys.all, "list"] as const,
	exercise: (id: string) => [...readingKeys.all, "exercise", id] as const,
}

export const readingListQueryOptions = () =>
	queryOptions({
		queryKey: readingKeys.list(),
		queryFn: mockFetchReading,
		staleTime: 1000 * 60 * 5,
	})

export const readingExerciseQueryOptions = (id: string) =>
	queryOptions({
		queryKey: readingKeys.exercise(id),
		queryFn: () => mockFetchReadingExercise(id),
		staleTime: 1000 * 60 * 5,
	})
