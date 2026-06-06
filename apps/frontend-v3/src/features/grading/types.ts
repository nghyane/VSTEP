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
		word_count: number | null
		sentence_count: number | null
		paragraph_count: number | null
		total_error_count: number | null
		grammar_error_count: number | null
		spelling_error_count: number | null
		punctuation_error_count: number | null
		linking_word_count: number | null
		unique_ratio: number | null
		avg_word_length: number | null
		readability_grade: number | null
	}
	data_status?: Record<string, boolean>
	annotations: AssessmentAnnotation[]
	by_type: Record<AssessmentAnnotation["type"], AssessmentAnnotation[]>
	counts_by_category: Record<string, number>
	service_status?: {
		language_tool?: {
			available: boolean
			checked?: boolean
			message: string | null
		}
	}
	word_requirement?: {
		minimum: number
		actual: number | null
		is_met: boolean | null
		missing: number | null
	}
	task_coverage?: {
		required_points: number
		covered_points: number | null
		coverage_ratio: number | null
		has_requirement_details: boolean
		source?: "heuristic" | "final"
		requirements: Array<{
			text: string
			met: boolean | null
		}>
	}
	format?: {
		letter_format_expected: boolean
		has_salutation: boolean | null
		has_closing: boolean | null
		tone: {
			formal_count: number | null
			informal_count: number | null
			informal_words: string[] | null
		}
	}
	cohesion?: {
		linking_word_count: number | null
		sentence_variety: number | null
	}
	vocabulary_profile?: {
		cefr_weighted_avg: number | null
		cefr_advanced_ratio: number | null
		cefr_vocab_count: number | null
		complex_vocab_count: number | null
	}
	profanity?: {
		found: boolean
		words: string[]
		count: number
	}
	speech?: {
		transcript: string | null
		confidence: number | null
		speaking_rate: number | null
		pause_count: number | null
		word_count: number | null
	}
	fluency?: {
		speaking_rate: number | null
		pause_count: number | null
		word_count: number | null
	}
	pronunciation?: {
		overall: number | null
		raw: Record<string, unknown>
	}
	content?: {
		content_factor: number | null
	}
}

export interface InsightsEntry {
	label: string
	detail: string
}

export interface WritingGradingResult {
	id?: string
	criterion_scores: CriterionScore[]
	overall_band: number
	source?: "ai"
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
	source?: "ai"
	display?: AssessmentResultDisplay
	diagnostics?: AssessmentDiagnostics
	feedback: AssessmentFeedback | null
	pronunciation_report?: { accuracy_score: number; insights?: Record<string, InsightsEntry> } | null
	transcript?: string | null
	created_at?: string
}

export interface PracticeSpeakingResultResponse {
	attempt_id?: string
	data: SpeakingGradingResult | null
	rubric: RubricMeta | null
	teacher_grading_request?: TeacherGradingRequestState
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

export type TeacherGradingRequestStatus =
	| "none"
	| "pending_assignment"
	| "assigned"
	| "in_progress"
	| "completed"
	| "cancelled"
	| "rejected"

export interface TeacherGradingRequestState {
	can_request: boolean
	requested: boolean
	request_id: string | null
	status: TeacherGradingRequestStatus
	assigned_teacher: { id: string; full_name: string | null; email: string | null } | null
	requested_at: string | null
	assigned_at: string | null
	completed_at: string | null
	teacher_result: TeacherGradingResultState | null
}

export interface TeacherGradingResultState {
	id: string
	overall_band: number
	criterion_scores: CriterionScore[]
	feedback: AssessmentFeedback | null
	submitted_at: string | null
	source: "teacher"
}

export interface TeacherGradingRequestResponse {
	id: string
	status: TeacherGradingRequestStatus
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
	teacher_grading_request: TeacherGradingRequestState
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
