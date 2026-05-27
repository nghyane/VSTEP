export interface GrammarPoint {
	id: string
	slug: string
	name: string
	vietnamese_name: string | null
	summary: string | null
	learning_objective: string | null
	success_criteria: string | null
	prerequisite_slugs: string[]
	cefr_descriptor: string | null
	vstep_use_case: string | null
	assessed_by: string[]
	is_checkpoint: boolean
	category: string | null
	display_order: number
	levels: string[]
	tasks?: string[]
	functions: string[]
	mastery: GrammarMastery | null
	exercise_count: number
	distinct_correct: number
}

export interface GrammarStructure {
	id: string
	template: string
	description: string | null
}

export interface GrammarExample {
	id: string
	en: string
	vi: string
	note: string | null
}

export interface GrammarMistake {
	id: string
	wrong: string
	correct: string
	explanation: string | null
}

export interface GrammarVstepTip {
	id: string
	task: string
	tip: string
	example: string | null
}

export interface GrammarExercise {
	id: string
	kind: "mcq"
	payload: { prompt: string; options: string[] }
	display_order: number
}

export interface GrammarMastery {
	attempts: number
	correct: number
	accuracy_percent: number
	computed_level: string
	last_practiced_at: string | null
}

export interface GrammarAttemptResponse {
	attempt_id: string
	is_correct: boolean
	explanation: string
	mastery: GrammarMastery
}

export interface GrammarPointDetail {
	point: GrammarPoint
	structures: GrammarStructure[]
	examples: GrammarExample[]
	common_mistakes: GrammarMistake[]
	vstep_tips: GrammarVstepTip[]
	exercises: GrammarExercise[]
	mastery: GrammarMastery | null
}
