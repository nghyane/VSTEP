import { queryOptions } from "@tanstack/react-query"
import { type ApiResponse, api } from "#/lib/api"
import type { PracticeExercise } from "#/features/practice/types"

export const practiceExercisesQuery = (skill: string) =>
	queryOptions({
		queryKey: ["practice", skill, "exercises"],
		queryFn: () => api.get(`practice/${skill}/exercises`).json<ApiResponse<PracticeExercise[]>>(),
	})
