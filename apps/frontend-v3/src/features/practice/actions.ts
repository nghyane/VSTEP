import { type ApiResponse, api } from "#/lib/api"
import type { PracticeSession, SubmitResult, SupportResult } from "#/features/practice/types"

export async function startListeningSession(exerciseId: string) {
	return api.post("practice/listening/sessions", { json: { exercise_id: exerciseId } }).json<ApiResponse<PracticeSession>>()
}

export async function useSupport(sessionId: string, level: number) {
	return api.post(`practice/listening/sessions/${sessionId}/support`, { json: { level } }).json<ApiResponse<SupportResult>>()
}

export async function submitListeningSession(sessionId: string, answers: { question_id: string; selected_index: number }[]) {
	return api.post(`practice/listening/sessions/${sessionId}/submit`, { json: { answers } }).json<ApiResponse<SubmitResult>>()
}
