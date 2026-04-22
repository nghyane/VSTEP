import type {
	StartSessionPayload,
	StartSessionResult,
	SubmitSessionPayload,
	SubmitSessionResult,
} from "#/features/exam/types"
import { type ApiResponse, api } from "#/lib/api"

export async function startExamSession(
	examId: string,
	payload: StartSessionPayload,
): Promise<StartSessionResult> {
	const res = await api
		.post(`exams/${examId}/sessions`, { json: payload })
		.json<ApiResponse<StartSessionResult>>()
	return res.data
}

export async function submitExamSession(
	sessionId: string,
	payload: SubmitSessionPayload,
): Promise<SubmitSessionResult> {
	const res = await api
		.post(`exam-sessions/${sessionId}/submit`, { json: payload })
		.json<ApiResponse<SubmitSessionResult>>()
	return res.data
}

export async function logListeningPlayed(sessionId: string, sectionId: string): Promise<void> {
	await api.post(`exam-sessions/${sessionId}/listening-played`, { json: { section_id: sectionId } })
}
