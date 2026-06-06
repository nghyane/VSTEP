import type {
	ExamResultStatus,
	ExamScoreInsight,
	ExamVersionSpeakingPart,
	ExamVersionWritingTask,
	SessionResultsData,
	SpeakingFeedbackItem,
	WritingFeedbackItem,
} from "#/features/exam/types"
import type {
	AssessmentDiagnostics,
	AssessmentFeedback,
	AssessmentResultDisplay,
	CriterionScore,
} from "#/features/grading/types"

export type ProductiveKind = "writing" | "speaking"

export interface ProductiveItem {
	readonly id: string
	readonly label: string
	readonly prompt: string
	readonly responseLabel: string
	readonly response: string | null
	readonly wordCount?: number
	readonly audioUrl?: string | null
	readonly score: number | null
	readonly status: ExamResultStatus
	readonly criteria: readonly CriterionScore[] | null
	readonly display: AssessmentResultDisplay | null
	readonly diagnostics: AssessmentDiagnostics | null
	readonly scoreInsights: readonly ExamScoreInsight[]
	readonly feedback: AssessmentFeedback | null
}

export function buildProductiveItems(result: SessionResultsData, kind: ProductiveKind): ProductiveItem[] {
	if (kind === "writing") return writingItems(result)
	return speakingItems(result)
}

function writingItems(result: SessionResultsData): ProductiveItem[] {
	const feedbackByTask = new Map(result.writing_feedback.map((item) => [item.task_id, item]))
	return [...(result.version?.writing_tasks ?? [])]
		.sort((a, b) => a.part - b.part || a.display_order - b.display_order)
		.map((task) => writingItem(task, feedbackByTask.get(task.id) ?? null))
}

function speakingItems(result: SessionResultsData): ProductiveItem[] {
	const feedbackByPart = new Map(result.speaking_feedback.map((item) => [item.part_id, item]))
	return [...(result.version?.speaking_parts ?? [])]
		.sort((a, b) => a.part - b.part || a.display_order - b.display_order)
		.map((part) => speakingItem(part, feedbackByPart.get(part.id) ?? null))
}

function writingItem(task: ExamVersionWritingTask, feedback: WritingFeedbackItem | null): ProductiveItem {
	return {
		id: task.id,
		label: `Task ${task.part}`,
		prompt: task.prompt,
		responseLabel: "Bài làm",
		response: feedback?.text ?? null,
		wordCount: feedback?.word_count,
		score: feedback?.overall_band ?? null,
		status: feedback?.score_status ?? "not_submitted",
		criteria: feedback?.criterion_scores ?? null,
		display: feedback?.display ?? null,
		diagnostics: feedback?.diagnostics ?? null,
		scoreInsights: feedback?.score_insights ?? [],
		feedback: feedback?.feedback ?? null,
	}
}

function speakingItem(part: ExamVersionSpeakingPart, feedback: SpeakingFeedbackItem | null): ProductiveItem {
	return {
		id: part.id,
		label: `Part ${part.part}`,
		prompt: speakingPromptText(part.content),
		responseLabel: "Bài nói",
		response: feedback?.transcript ?? null,
		audioUrl: feedback?.audio_url,
		score: feedback?.overall_band ?? null,
		status: feedback?.score_status ?? "not_submitted",
		criteria: feedback?.criterion_scores ?? null,
		display: feedback?.display ?? null,
		diagnostics: feedback?.diagnostics ?? null,
		scoreInsights: feedback?.score_insights ?? [],
		feedback: feedback?.feedback ?? null,
	}
}

function speakingPromptText(content: Record<string, unknown>): string {
	const lines = Object.entries(content).flatMap(([key, value]) => formatPromptLine(humanizeKey(key), value))
	return lines.length > 0 ? lines.join("\n") : "Chưa có nội dung đề."
}

function formatPromptLine(label: string, value: unknown): string[] {
	if (Array.isArray(value)) return [`${label}: ${value.map(formatPromptValue).join("; ")}`]
	if (isPlainObject(value)) {
		const nested = Object.entries(value).map(
			([key, entry]) => `- ${humanizeKey(key)}: ${formatPromptValue(entry)}`,
		)
		return [`${label}:`, ...nested]
	}
	return [`${label}: ${formatPromptValue(value)}`]
}

function formatPromptValue(value: unknown): string {
	if (typeof value === "string") return value
	if (typeof value === "number" || typeof value === "boolean") return String(value)
	if (value === null || value === undefined) return "—"
	if (Array.isArray(value)) return value.map(formatPromptValue).join("; ")
	if (isPlainObject(value)) {
		return Object.entries(value)
			.map(([key, entry]) => `${humanizeKey(key)}: ${formatPromptValue(entry)}`)
			.join("; ")
	}
	return String(value)
}

function humanizeKey(key: string): string {
	return key.replaceAll("_", " ")
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}
