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
}

export interface RubricMeta {
	max_score: number
	criteria: RubricCriteriaMeta[]
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
