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

export interface SrsState {
	kind: "new" | "learning" | "review" | "relearning"
}

export type SrsRating = 1 | 2 | 3 | 4

export interface WordWithState {
	word: VocabWord
	state: SrsState
}

export interface BackLink {
	backTo: string
	backParams?: Record<string, string>
}

export interface ReviewResponse {
	state: SrsState
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
	items: { word: VocabWord; state: SrsState }[]
}

export interface VocabExercise {
	id: string
	kind: string
	payload: Record<string, unknown>
	display_order: number
}

export interface TopicDetailResponse {
	topic: VocabTopic
	words: { word: VocabWord; state: SrsState }[]
	exercises: VocabExercise[]
}
