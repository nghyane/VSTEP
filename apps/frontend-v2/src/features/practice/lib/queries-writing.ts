import { queryOptions } from "@tanstack/react-query"
import { mockFetchWriting, mockFetchWritingExercise } from "#/mocks/writing"

export const writingKeys = {
	all: ["writing"] as const,
	list: () => [...writingKeys.all, "list"] as const,
	exercise: (id: string) => [...writingKeys.all, "exercise", id] as const,
}

export const writingListQueryOptions = () =>
	queryOptions({
		queryKey: writingKeys.list(),
		queryFn: mockFetchWriting,
		staleTime: 1000 * 60 * 5,
	})

export const writingExerciseQueryOptions = (id: string) =>
	queryOptions({
		queryKey: writingKeys.exercise(id),
		queryFn: () => mockFetchWritingExercise(id),
		staleTime: 1000 * 60 * 5,
	})
