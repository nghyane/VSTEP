export interface VocabTopic {
	id: string
	slug: string
	name: string
	description: string | null
	level: string
	icon_key: string | null
	display_order: number
	tasks: string[]
	word_count?: number
	learned_count?: number
}

export interface VocabWord {
	id: string
	word: string
	phonetic: string | null
	part_of_speech: string | null
	definition: string
	example: string | null
	synonyms: string[]
	collocations: string[]
	word_family: string[]
	vstep_tip: string | null
}

export interface FsrsState {
	kind: "new" | "learning" | "review" | "relearning"
	difficulty: number
	stability: number
	retrievability: number
	lapses: number
}

export type SrsRating = 1 | 2 | 3 | 4

export type ExerciseKind = "mcq" | "fill_blank" | "word_form"

export interface WordWithState {
	word: VocabWord
	state: FsrsState
}

export interface BackLink {
	backTo: string
	backParams?: Record<string, string>
}

export interface ReviewResponse {
	state: FsrsState
	review_id: string
}

export interface AttemptResponse {
	attempt_id: string
	is_correct: boolean
	explanation: string | null
}

export interface SrsQueueResponse {
	new_count: number
	learning_count: number
	review_count: number
	next_due_at: string | null
	items: WordWithState[]
}

export interface McqPayload {
	prompt: string
	options: string[]
}

export interface FillBlankPayload {
	sentence: string
}

export interface WordFormPayload {
	instruction: string
	sentence: string
	root_word: string
}

interface BaseExercise {
	id: string
	display_order: number
}

export type VocabExercise =
	| (BaseExercise & { kind: "mcq"; payload: McqPayload })
	| (BaseExercise & { kind: "fill_blank"; payload: FillBlankPayload })
	| (BaseExercise & { kind: "word_form"; payload: WordFormPayload })

export interface TopicDetailResponse {
	topic: VocabTopic
	words: WordWithState[]
	exercises: VocabExercise[]
}
