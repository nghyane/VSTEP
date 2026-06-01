// ai-grading-types — interfaces cho AI grading result.
// TODO(backend): implement POST /api/v1/grading/writing + speaking

export interface WritingAnnotation {
	start: number
	end: number
	severity: "error" | "suggestion"
	category: string
	message: string
	suggestion?: string
}

export interface ParagraphFeedback {
	index: number
	wordCount: number
	suggestedWordRange: { min: number; max: number }
	status: "good" | "warn" | "bad"
	checklist: readonly { point: string; covered: boolean }[]
	notes: readonly string[]
}

export interface CohesionHint {
	afterParagraphIndex: number
	suggestion: string
}

export interface AnnotatedWritingFeedback {
	annotations: readonly WritingAnnotation[]
	paragraphs: readonly ParagraphFeedback[]
	cohesionHints: readonly CohesionHint[]
	strengths: readonly string[]
	improvements: readonly { message: string; explanation: string; annotationIdx?: number }[]
	rewrites: readonly { original: string; improved: string; reason: string }[]
}
