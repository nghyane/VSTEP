import type {
	ConversationSessionDetail,
	ConversationTurn,
	PracticeSession,
	SubmitResult,
	WritingSubmission,
} from "#/features/practice/types"
import { type ApiResponse, api } from "#/lib/api"

export async function startListeningSession(exerciseId: string) {
	return api
		.post("practice/listening/sessions", { json: { exercise_id: exerciseId } })
		.json<ApiResponse<PracticeSession>>()
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

export async function startConversation(scenarioId: string) {
	return api
		.post("practice/speaking/conversations", { json: { scenario_id: scenarioId } })
		.json<ApiResponse<ConversationSessionDetail>>()
}

export async function submitConversationTurn(sessionId: string, text: string, confidence: number) {
	return api.post(`practice/speaking/conversations/${sessionId}/turn`, { json: { text, confidence } }).json<
		ApiResponse<{
			user_turn: ConversationTurn
			ai_turn: ConversationTurn
			session: { user_turn_count: number; expected_turns: number; should_end: boolean }
		}>
	>()
}

export async function endConversation(sessionId: string) {
	return api.post(`practice/speaking/conversations/${sessionId}/end`).json<
		ApiResponse<{
			session_id: string
			duration_seconds: number
			user_turn_count: number
			vocab_used_pct: number
			grammar_ok_pct: number
		}>
	>()
}

export interface ConversationReview {
	strengths: string[]
	improvements: string[]
	corrected_sentences: { original: string; corrected: string; explanation: string }[]
	tip: string
}

export async function getConversationReview(sessionId: string) {
	return api
		.get(`practice/speaking/conversations/${sessionId}/review`)
		.json<ApiResponse<ConversationReview>>()
}

export interface PronunciationReview {
	pronunciation: string
	intonation: string
	tip: string
}

export async function getPronunciationReview(original: string, transcript: string) {
	return api
		.post("practice/speaking/pronunciation-review", { json: { original, transcript } })
		.json<ApiResponse<PronunciationReview>>()
}

export interface RequestFeedbackResponse {
	submission_id: string
	status: string
	channel: string
	event: string
}

export async function requestWritingFeedback(submissionId: string) {
	return api
		.post(`practice/writing/submissions/${submissionId}/feedback`)
		.json<ApiResponse<RequestFeedbackResponse>>()
}
