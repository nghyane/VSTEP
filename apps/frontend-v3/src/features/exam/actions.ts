import type {
	ExamDraft,
	ExamDraftPayload,
	LogListeningPlayedResult,
	StartSessionPayload,
	StartSessionResult,
	SubmitSessionPayload,
	SubmitSessionResult,
} from "#/features/exam/types"
import { type ApiResponse, api } from "#/lib/api"

interface PresignedAudioUpload {
	upload_url: string
	audio_key: string
	audio_url: string
}

export async function startExamSession(
	examId: string,
	payload: StartSessionPayload,
): Promise<StartSessionResult> {
	const res = await api
		.post(`exams/${examId}/sessions`, { json: payload })
		.json<ApiResponse<StartSessionResult>>()
	return res.data
}

export async function restartExamSession(
	examId: string,
	payload: StartSessionPayload & { abandon_session_id: string },
): Promise<StartSessionResult> {
	const res = await api
		.post(`exams/${examId}/sessions/restart`, { json: payload })
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

export async function logListeningPlayed(
	sessionId: string,
	sectionId: string,
): Promise<LogListeningPlayedResult> {
	const res = await api
		.post(`exam-sessions/${sessionId}/listening-played`, { json: { section_id: sectionId } })
		.json<ApiResponse<LogListeningPlayedResult>>()
	return res.data
}

export async function uploadExamSpeakingAudio(
	blob: Blob,
): Promise<Pick<PresignedAudioUpload, "audio_key" | "audio_url">> {
	const contentType = blob.type || "audio/webm"
	const presign = await api
		.post("audio/presign-upload", {
			json: {
				context: "exam_speaking",
				content_type: contentType,
				extension: "webm",
			},
		})
		.json<ApiResponse<PresignedAudioUpload>>()

	const uploaded = await fetch(presign.data.upload_url, {
		method: "PUT",
		headers: { "Content-Type": contentType },
		body: blob,
	})
	if (!uploaded.ok) throw new Error("Không upload được bản ghi âm. Vui lòng thử lại.")
	return {
		audio_key: presign.data.audio_key,
		audio_url: presign.data.audio_url,
	}
}

export async function saveExamDraft(sessionId: string, payload: ExamDraftPayload): Promise<ExamDraft> {
	const res = await api
		.put(`exam-sessions/${sessionId}/draft`, { json: payload })
		.json<ApiResponse<ExamDraft>>()
	return res.data
}
