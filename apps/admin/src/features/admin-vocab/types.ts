export type VocabExerciseKind = "mcq" | "fill_blank" | "word_form"

export type VocabTask = "WT1" | "WT2" | "SP1" | "SP2" | "SP3" | "READ"

export const VOCAB_TASKS: VocabTask[] = ["WT1", "WT2", "SP1", "SP2", "SP3", "READ"]

export const VOCAB_LEVELS = ["A2", "B1", "B2", "C1"] as const
export type VocabLevel = (typeof VOCAB_LEVELS)[number]

export interface AdminVocabTopic {
	id: string
	slug: string
	name: string
	description: string | null
	level: VocabLevel | string
	icon_key: string
	display_order: number
	is_published: boolean
	tasks: VocabTask[]
	word_count?: number
	exercise_count?: number
	created_at: string
	updated_at: string
}

export interface AdminVocabWord {
	id: string
	topic_id: string
	word: string
	phonetic: string | null
	part_of_speech: string
	definition: string
	example: string | null
	synonyms: string[]
	collocations: string[]
	word_family: string[]
	vstep_tip: string | null
	display_order: number
}

export interface McqPayload {
	prompt: string
	options: [string, string, string, string]
	correct_index: number
}

export interface FillBlankPayload {
	sentence: string
	accepted_answers: string[]
}

export interface WordFormPayload {
	instruction: string
	sentence: string
	root_word: string
	accepted_answers: string[]
}

export type AdminVocabExercise =
	| {
			id: string
			topic_id: string
			display_order: number
			explanation: string
			kind: "mcq"
			payload: McqPayload
	  }
	| {
			id: string
			topic_id: string
			display_order: number
			explanation: string
			kind: "fill_blank"
			payload: FillBlankPayload
	  }
	| {
			id: string
			topic_id: string
			display_order: number
			explanation: string
			kind: "word_form"
			payload: WordFormPayload
	  }

export interface AdminVocabTopicDetail {
	topic: AdminVocabTopic
	words: AdminVocabWord[]
	exercises: AdminVocabExercise[]
}

export interface ListTopicsFilters {
	page?: number
	per_page?: number
	q?: string
	is_published?: "all" | "yes" | "no"
	level?: string
}

export type TopicFormInput = Omit<
	AdminVocabTopic,
	"id" | "word_count" | "exercise_count" | "created_at" | "updated_at" | "tasks"
> & {
	tasks: VocabTask[]
}

export type WordFormInput = Omit<AdminVocabWord, "id" | "topic_id">

export interface ExerciseFormInput {
	kind: VocabExerciseKind
	explanation: string
	display_order?: number
	payload: McqPayload | FillBlankPayload | WordFormPayload
}
