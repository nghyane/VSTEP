export interface GrammarPoint {
	id: string
	slug: string
	name: string
	vietnamese_name: string | null
	summary: string | null
	category: string | null
	display_order: number
	levels: string[]
	tasks: string[]
	functions: string[]
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
	kind: string
	payload: Record<string, unknown>
	display_order: number
}

export interface GrammarMastery {
	attempts: number
	correct: number
	accuracy_percent: number
	computed_level: string
	last_practiced_at: string | null
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
