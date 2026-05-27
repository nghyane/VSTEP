export type GrammarExerciseKind = "mcq"

export type GrammarTask = "WT1" | "WT2" | "SP1" | "SP2" | "SP3" | "READ"
export const GRAMMAR_TASKS: GrammarTask[] = ["WT1", "WT2", "SP1", "SP2", "SP3", "READ"]

export const GRAMMAR_LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const
export type GrammarLevel = (typeof GRAMMAR_LEVELS)[number]

export const GRAMMAR_CATEGORIES = [
	{ value: "foundation", label: "Foundation" },
	{ value: "sentence", label: "Sentence" },
	{ value: "task", label: "Task" },
	{ value: "writing", label: "Writing" },
	{ value: "error-clinic", label: "Error clinic" },
] as const
export type GrammarCategory = (typeof GRAMMAR_CATEGORIES)[number]["value"]

export interface AdminGrammarPoint {
	id: string
	slug: string
	name: string
	vietnamese_name: string | null
	summary: string
	learning_objective: string | null
	success_criteria: string | null
	prerequisite_slugs: string[]
	cefr_descriptor: string | null
	vstep_use_case: string | null
	assessed_by: string[]
	is_checkpoint: boolean
	category: GrammarCategory | string
	display_order: number
	is_published: boolean
	levels: GrammarLevel[]
	tasks: GrammarTask[]
	functions: string[]
	structure_count?: number
	example_count?: number
	exercise_count?: number
	created_at: string
	updated_at: string
}

export interface AdminGrammarStructure {
	id: string
	grammar_point_id: string
	template: string
	description: string | null
	display_order: number
}

export interface AdminGrammarExample {
	id: string
	grammar_point_id: string
	en: string
	vi: string
	note: string | null
	display_order: number
}

export interface AdminGrammarMistake {
	id: string
	grammar_point_id: string
	wrong: string
	correct: string
	explanation: string
	display_order: number
}

export interface AdminGrammarTip {
	id: string
	grammar_point_id: string
	task: GrammarTask
	tip: string
	example: string
	display_order: number
}

export interface McqPayload {
	prompt: string
	options: [string, string, string, string]
	correct_index: number
}

export interface AdminGrammarExercise {
	id: string
	grammar_point_id: string
	display_order: number
	explanation: string
	is_active: boolean
	kind: "mcq"
	payload: McqPayload
}

export interface AdminGrammarPointDetail {
	point: AdminGrammarPoint
	structures: AdminGrammarStructure[]
	examples: AdminGrammarExample[]
	mistakes: AdminGrammarMistake[]
	tips: AdminGrammarTip[]
	exercises: AdminGrammarExercise[]
}

export interface ListPointsFilters {
	page?: number
	per_page?: number
	q?: string
	is_published?: "all" | "yes" | "no"
	category?: string
}

export type PointFormInput = Pick<
	AdminGrammarPoint,
	| "slug"
	| "name"
	| "vietnamese_name"
	| "summary"
	| "learning_objective"
	| "success_criteria"
	| "prerequisite_slugs"
	| "cefr_descriptor"
	| "vstep_use_case"
	| "assessed_by"
	| "is_checkpoint"
	| "category"
	| "display_order"
	| "is_published"
> & {
	levels: GrammarLevel[]
	tasks: GrammarTask[]
	functions: string[]
}

export type StructureFormInput = Pick<AdminGrammarStructure, "template" | "description" | "display_order">
export type ExampleFormInput = Pick<AdminGrammarExample, "en" | "vi" | "note" | "display_order">
export type MistakeFormInput = Pick<
	AdminGrammarMistake,
	"wrong" | "correct" | "explanation" | "display_order"
>
export type TipFormInput = Pick<AdminGrammarTip, "task" | "tip" | "example" | "display_order">

export interface ExerciseFormInput {
	kind: GrammarExerciseKind
	explanation: string
	display_order?: number
	payload: McqPayload
}
