import type { AttemptResponse, ReviewResponse, SrsRating } from "#/features/vocab/types"
import { type ApiResponse, api } from "#/lib/api"

export async function reviewWord(wordId: string, rating: SrsRating) {
	return api
		.post("vocab/srs/review", { json: { word_id: wordId, rating } })
		.json<ApiResponse<ReviewResponse>>()
}

export async function attemptExercise(exerciseId: string, answer: Record<string, unknown>) {
	return api
		.post(`vocab/exercises/${exerciseId}/attempt`, { json: { answer } })
		.json<ApiResponse<AttemptResponse>>()
}
