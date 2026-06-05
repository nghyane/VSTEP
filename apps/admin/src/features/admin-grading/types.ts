export interface ScoringPolicy {
	id: string
	rubric_id: string
	version: number
	name: string
	rules: { caps?: Record<string, CapRule[]> }
	is_active: boolean
	created_at: string
}

export interface CapRule {
	metric: string
	op: string
	value: number
	max: number
	all?: { metric: string; op: string; value: number }[]
}

export interface Criterion {
	key: string
	name: string
	name_vi?: string
	max_score: number
	weight: number
	band_descriptors: Record<string, string> | string[]
}

export interface RubricLifecycle {
	status: "active" | "draft" | "archived"
	is_editable: boolean
	read_only_reason: string | null
}

export interface RubricAdminActions {
	can_edit: boolean
	can_clone: boolean
	can_activate: boolean
	can_archive: boolean
	can_delete: boolean
}

export interface WritingPolicySummary {
	severity: string
	severity_label: string
	assessment_gates: {
		severe_minimum_words_task1: number
		severe_minimum_words_task2: number
		minimum_covered_points: number
	} | null
	system_gates: Record<string, { enabled: boolean; description: string }> | null
	word_rules: {
		official_minimum_task1: number
		official_minimum_task2: number
		short_response_caps: Array<{ max_words: number; cap: number }>
		task_fulfillment_word_caps: Array<{ max_words: number; cap: number }>
	} | null
	criteria_weights: Record<string, number>
}

export interface GradingRubric {
	id: string
	skill: string
	version: number
	name: string
	source_reference: string | null
	criteria: Criterion[]
	scoring_formula: string
	is_active: boolean
	lifecycle: RubricLifecycle
	admin_actions: RubricAdminActions
	policy_summary: WritingPolicySummary
	effective_from: string | null
	created_at: string
	policies?: ScoringPolicy[]
	active_policy?: ScoringPolicy | null
}
