import { queryOptions } from "@tanstack/react-query"
import { type ApiResponse, api } from "#/lib/api"
import type { ExerciseDetail, ListeningExercise, ReadingExercise } from "#/features/practice/types"

export const listeningExercisesQuery = queryOptions({
	queryKey: ["practice", "listening", "exercises"],
	queryFn: () => api.get("practice/listening/exercises").json<ApiResponse<ListeningExercise[]>>(),
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
