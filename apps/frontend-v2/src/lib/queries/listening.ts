// queryOptions factory cho listening.
// Khi có API thật: thay queryFn → apiFetchListening, xóa mock imports.

import { queryOptions } from "@tanstack/react-query"
import { mockFetchListening, mockFetchListeningExercise } from "#/lib/mock/listening"

export const listeningKeys = {
	all: ["listening"] as const,
	list: () => [...listeningKeys.all, "list"] as const,
	exercise: (id: string) => [...listeningKeys.all, "exercise", id] as const,
}

export const listeningListQueryOptions = () =>
	queryOptions({
		queryKey: listeningKeys.list(),
		queryFn: mockFetchListening,
		staleTime: 1000 * 60 * 5,
	})

export const listeningExerciseQueryOptions = (id: string) =>
	queryOptions({
		queryKey: listeningKeys.exercise(id),
		queryFn: () => mockFetchListeningExercise(id),
		staleTime: 1000 * 60 * 5,
	})
