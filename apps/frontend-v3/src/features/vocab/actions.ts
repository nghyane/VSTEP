import { api, type ApiResponse } from "#/lib/api"
import type { AttemptResponse, ReviewResponse, SrsRating } from "#/features/vocab/types"

export type { SrsRating } from "#/features/vocab/types"

export async function reviewWord(wordId: string, rating: SrsRating) {
	return api.post("vocab/srs/review", { json: { word_id: wordId, rating } }).json<ApiResponse<ReviewResponse>>()
}

export async function attemptExercise(exerciseId: string, answer: Record<string, unknown>) {
	return api.post(`vocab/exercises/${exerciseId}/attempt`, { json: { answer } }).json<ApiResponse<AttemptResponse>>()
}
