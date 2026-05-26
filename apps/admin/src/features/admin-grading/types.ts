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
	band_descriptors: string[]
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
	effective_from: string | null
	created_at: string
	policies?: ScoringPolicy[]
	active_policy?: ScoringPolicy | null
}
