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
	evidenceNotes?: string[] | Record<string, InsightsEntry>
	rewrites?: Array<Rewrite | string>
}

export interface AssessmentResultDisplay {
	status: "not_assessable" | "below_b1" | "passed"
	status_label: string
	level: "B1" | "B2" | "C1" | "below_b1" | null
	level_label: string
	is_assessable: boolean
	is_passing: boolean
	score: {
		value: number
		max: number
		label: string
		should_show: boolean
		emphasis: "primary" | "secondary"
	}
	reason: {
		code: string
		label: string | null
		source: string | null
		details: Record<string, unknown> | unknown[]
	}
	message: string
	thresholds: {
		min_b1: number
		min_b2: number
		min_c1: number
		max_score: number
	}
	ui: {
		tone: "danger" | "warning" | "success"
		badge: string
		show_score: boolean
		show_criterion_breakdown: boolean
		show_feedback: boolean
		primary_action: "rewrite" | null
	}
}

export interface AssessmentAnnotation {
	start: number
	end: number
	length: number
	text: string
	type: "spelling" | "grammar" | "punctuation" | "style" | "other"
	severity: string
	category: string
	message: string
	suggestions: string[]
	rule_id: string
}

export interface AssessmentDiagnostics {
	summary: {
		word_count: number
		sentence_count: number
		paragraph_count: number
		total_error_count: number
		grammar_error_count: number
		spelling_error_count: number
		punctuation_error_count: number
		linking_word_count: number
		unique_ratio: number
		avg_word_length: number
		readability_grade: number
	}
	annotations: AssessmentAnnotation[]
	by_type: Record<AssessmentAnnotation["type"], AssessmentAnnotation[]>
	counts_by_category: Record<string, number>
}

export interface InsightsEntry {
	label: string
	detail: string
}

export interface WritingGradingResult {
	id?: string
	criterion_scores: CriterionScore[]
	overall_band: number
	display?: AssessmentResultDisplay
	diagnostics?: AssessmentDiagnostics
	feedback: AssessmentFeedback | null
	annotations?: { _insights?: Record<string, InsightsEntry> } | null
	created_at?: string
}

export interface SpeakingGradingResult {
	id?: string
	criterion_scores: CriterionScore[]
	overall_band: number
	display?: AssessmentResultDisplay
	diagnostics?: AssessmentDiagnostics
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

export interface RequestFeedbackResponse {
	submission_id: string
	status: "pending" | "ready" | "failed"
	cost_coins: number
	charged: boolean
	feedback: AssessmentFeedback | null
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
