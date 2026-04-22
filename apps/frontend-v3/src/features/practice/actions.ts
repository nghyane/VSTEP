import type {
	PracticeSession,
	SubmitResult,
	SupportResult,
	WritingSubmission,
} from "#/features/practice/types"
import { type ApiResponse, api } from "#/lib/api"

export async function startListeningSession(exerciseId: string) {
	return api
		.post("practice/listening/sessions", { json: { exercise_id: exerciseId } })
		.json<ApiResponse<PracticeSession>>()
}

export async function useSupport(sessionId: string, level: number) {
	return api
		.post(`practice/listening/sessions/${sessionId}/support`, { json: { level } })
		.json<ApiResponse<SupportResult>>()
}

export async function submitListeningSession(
	sessionId: string,
	answers: { question_id: string; selected_index: number }[],
) {
	return api
		.post(`practice/listening/sessions/${sessionId}/submit`, { json: { answers } })
		.json<ApiResponse<SubmitResult>>()
}

export async function startReadingSession(exerciseId: string) {
	return api
		.post("practice/reading/sessions", { json: { exercise_id: exerciseId } })
		.json<ApiResponse<PracticeSession>>()
}

export async function submitReadingSession(
	sessionId: string,
	answers: { question_id: string; selected_index: number }[],
) {
	return api
		.post(`practice/reading/sessions/${sessionId}/submit`, { json: { answers } })
		.json<ApiResponse<SubmitResult>>()
}

export async function startWritingSession(exerciseId: string) {
	return api
		.post("practice/writing/sessions", { json: { exercise_id: exerciseId } })
		.json<ApiResponse<{ session_id: string; started_at: string }>>()
}

export async function submitWritingSession(sessionId: string, text: string) {
	return api
		.post(`practice/writing/sessions/${sessionId}/submit`, { json: { text } })
		.json<ApiResponse<WritingSubmission>>()
}

export async function startSpeakingDrillSession(exerciseId: string) {
	return api
		.post("practice/speaking/drill-sessions", { json: { exercise_id: exerciseId } })
		.json<ApiResponse<{ session_id: string; started_at: string }>>()
}

export async function submitDrillAttempt(
	sessionId: string,
	sentenceId: string,
	mode: "dictation" | "shadowing",
) {
	return api
		.post(`practice/speaking/drill-sessions/${sessionId}/attempt`, {
			json: { sentence_id: sentenceId, mode },
		})
		.json<ApiResponse<{ attempt_id: string; accuracy_percent: number | null }>>()
}

export async function startVstepSpeakingSession(exerciseId: string) {
	return api
		.post("practice/speaking/vstep-sessions", { json: { exercise_id: exerciseId } })
		.json<ApiResponse<{ session_id: string; started_at: string }>>()
}

export async function submitVstepSpeaking(sessionId: string, audioUrl: string, durationSeconds: number) {
	return api
		.post(`practice/speaking/vstep-sessions/${sessionId}/submit`, {
			json: { audio_url: audioUrl, duration_seconds: durationSeconds },
		})
		.json<ApiResponse<{ submission_id: string; grading_status: string }>>()
}
