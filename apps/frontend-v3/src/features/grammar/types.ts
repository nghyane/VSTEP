export interface GrammarPoint {
	id: string
	name: string
	slug: string
	level: string
	description: string | null
	display_order: number
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

export interface GrammarExercise {
	id: string
	kind: string
	payload: Record<string, unknown>
	display_order: number
}

export interface GrammarPointDetail {
	point: GrammarPoint
	structures: GrammarStructure[]
	examples: GrammarExample[]
	common_mistakes: GrammarMistake[]
	vstep_tips: { id: string; task: string; tip: string; example: string | null }[]
	exercises: GrammarExercise[]
	mastery: { level: string; correct_count: number; total_count: number } | null
}
