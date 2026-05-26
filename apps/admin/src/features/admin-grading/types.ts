export interface ScoringPolicy {
	id: string
	rubric_id: string
	version: number
	name: string
	rules: { caps?: CapRule[] }
	is_active: boolean
	created_at: string
}

export interface CapRule {
	criterion: string
	condition: string
	max_score: number
}

export interface BandDescriptor {
	band: number
	description: string
}

export interface Criterion {
	key: string
	name: string
	name_vi?: string
	max_score: number
	weight: number
	band_descriptors: BandDescriptor[]
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
