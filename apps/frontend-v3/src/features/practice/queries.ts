import { queryOptions } from "@tanstack/react-query"
import { type ApiResponse, api } from "#/lib/api"
import type { ExerciseDetail, ListeningExerciseSummary, ReadingExercise } from "#/features/practice/types"

export const listeningExercisesQuery = queryOptions({
	queryKey: ["practice", "listening", "exercises"],
	queryFn: () => api.get("practice/listening/exercises").json<ApiResponse<ListeningExerciseSummary[]>>(),
})

export const listeningExerciseDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["practice", "listening", "exercises", id],
		queryFn: () => api.get(`practice/listening/exercises/${id}`).json<ApiResponse<ExerciseDetail>>(),
	})

export const readingExercisesQuery = queryOptions({
	queryKey: ["practice", "reading", "exercises"],
	queryFn: () => api.get("practice/reading/exercises").json<ApiResponse<ReadingExercise[]>>(),
})
