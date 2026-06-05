import type {
	ExamVersionMcqItem,
	ExamVersionWritingTask,
	McqAnswerPayload,
	SpeakingAnswerPayload,
	WritingAnswerPayload,
} from "#/features/exam/types"

export type SpeakingRecordingPayloadSource = {
	readonly audioKey: string
	readonly durationSeconds: number
}

export function buildMcqPayload(
	items: readonly ExamVersionMcqItem[],
	refType: string,
	answers: ReadonlyMap<string, number>,
): McqAnswerPayload[] {
	const payload: McqAnswerPayload[] = []
	for (const item of items) {
		const selectedIndex = answers.get(item.id)
		if (selectedIndex === undefined) continue
		payload.push({
			item_ref_type: refType,
			item_ref_id: item.id,
			selected_index: selectedIndex,
		})
	}

	return payload
}

export function buildWritingPayload(
	tasks: readonly ExamVersionWritingTask[],
	answers: ReadonlyMap<string, string>,
): WritingAnswerPayload[] {
	return tasks.map((task) => {
		const text = normalizeWritingText(answers.get(task.id)).trim()

		return {
			task_id: task.id,
			text,
			word_count: countWords(text),
		}
	})
}

export function buildSpeakingPayload(
	answers: ReadonlyMap<string, SpeakingRecordingPayloadSource>,
): SpeakingAnswerPayload[] {
	return Array.from(answers, ([partId, answer]) => ({
		part_id: partId,
		audio_key: answer.audioKey,
		duration_seconds: answer.durationSeconds,
	}))
}

function normalizeWritingText(value: string | undefined): string {
	return value ?? ""
}

function countWords(text: string): number {
	if (text === "") return 0

	return text.split(/\s+/).filter(Boolean).length
}
