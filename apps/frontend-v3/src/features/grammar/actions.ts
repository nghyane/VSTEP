import type { GrammarAttemptResponse } from "#/features/grammar/types"
import { type ApiResponse, api } from "#/lib/api"

export async function attemptGrammarExercise(exerciseId: string, answer: Record<string, unknown>) {
	return api
		.post(`grammar/exercises/${exerciseId}/attempt`, { json: { answer } })
		.json<ApiResponse<GrammarAttemptResponse>>()
}
