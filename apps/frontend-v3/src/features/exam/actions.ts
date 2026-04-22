import type { StartSessionPayload, StartSessionResult } from "#/features/exam/types"
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
