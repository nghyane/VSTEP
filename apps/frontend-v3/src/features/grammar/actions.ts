import { type ApiResponse, api } from "#/lib/api"
import type { GrammarAttemptResponse } from "#/features/grammar/types"

export async function attemptGrammarExercise(exerciseId: string, answer: Record<string, unknown>) {
	return api.post(`grammar/exercises/${exerciseId}/attempt`, { json: { answer } }).json<ApiResponse<GrammarAttemptResponse>>()
}
