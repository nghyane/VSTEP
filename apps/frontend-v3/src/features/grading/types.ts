export interface Improvement {
	message: string
	explanation?: string
}

export interface Rewrite {
	original: string
	improved: string
	reason?: string
}

export interface CriterionScore {
	key: string
	score: number
	weight: number
	evidence_used?: unknown
	trace?: unknown
}

export interface AssessmentFeedback {
	strengths?: string[]
	improvements?: Array<Improvement | string>
	warnings?: string[]
	evidenceNotes?: string[]
	rewrites?: Array<Rewrite | string>
}

export interface InsightsEntry {
	label: string
	detail: string
}

export interface WritingGradingResult {
	id?: string
	criterion_scores: CriterionScore[]
	overall_band: number
	feedback: AssessmentFeedback | null
	annotations?: { _insights?: Record<string, InsightsEntry> } | null
	created_at?: string
}

export interface SpeakingGradingResult {
	id?: string
	criterion_scores: CriterionScore[]
	overall_band: number
	feedback: AssessmentFeedback | null
	pronunciation_report?: { accuracy_score: number; insights?: Record<string, InsightsEntry> } | null
	transcript?: string | null
	created_at?: string
}

export interface RubricCriteriaMeta {
	key: string
	label: string
	max?: number
	weight?: number
}

export interface RubricMeta {
	max_score: number
	criteria: RubricCriteriaMeta[]
}

export interface GradingProgress {
	phase: string
	duration_ms: number
	[key: string]: unknown
}

export interface AssessmentJobResult {
	attempt_id?: string
	status: "pending" | "processing" | "ready" | "failed"
	progress: GradingProgress[] | GradingProgress
	scores?: WritingGradingResult
	error?: string
}

export interface AssessmentViewContext {
	skill: "writing" | "speaking"
	task_type: string
	part: number | null
	title: string | null
	prompt: string | null
	response_text?: string | null
	word_count?: number | null
	audio_url?: string | null
	transcript?: string | null
	duration_seconds?: number | null
	submitted_at: string
}

export interface AssessmentFeedbackRequestState {
	can_request: boolean
	requested: boolean
	cost_coins: number
	status: "none" | "pending" | "ready" | "failed"
}

export interface AssessmentView {
	attempt_id: string
	source: {
		type: "practice_writing" | "exam_writing" | "practice_speaking" | "exam_speaking"
		submission_id: string
		session_id: string | null
	}
	status: "pending" | "processing" | "ready" | "failed"
	progress: GradingProgress[] | GradingProgress
	error: string | null
	context: AssessmentViewContext
	rubric: RubricMeta
	result: WritingGradingResult | SpeakingGradingResult | null
	feedback_request: AssessmentFeedbackRequestState
}

export interface GradingJob {
	id: string
	submission_type: string
	submission_id: string
	status: "pending" | "processing" | "ready" | "failed"
	attempts: number
	last_error: string | null
	started_at: string | null
	completed_at: string | null
}
