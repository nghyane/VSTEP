import { api } from "#/lib/api"

// Anki ratings: 1=Again, 2=Hard, 3=Good, 4=Easy
export type SrsRating = 1 | 2 | 3 | 4

export async function reviewWord(wordId: string, rating: SrsRating) {
	return api.post("vocab/srs/review", { json: { word_id: wordId, rating } }).json()
}

export async function attemptExercise(exerciseId: string, answer: Record<string, unknown>) {
	return api.post(`vocab/exercises/${exerciseId}/attempt`, { json: { answer } }).json<{
		data: { attempt_id: string; is_correct: boolean; explanation: string | null }
	}>()
}
