// ─── Common ──────────────────────────────────────────────

export interface WordTimestamp {
	word: string
	offset: number
	duration: number
}

export interface McqQuestion {
	id: string
	exercise_id: string
	display_order: number
	question: string
	options: string[]
	correct_index: number
	explanation: string
}

export interface McqQuestionFormInput {
	question: string
	options: [string, string, string, string]
	correct_index: number
	explanation: string
	display_order?: number
}

// ─── Listening ───────────────────────────────────────────

export interface AdminListeningExercise {
	id: string
	slug: string
	title: string
	description: string | null
	part: number
	audio_url: string | null
	transcript: string
	vietnamese_transcript: string | null
	word_timestamps: WordTimestamp[]
	keywords: string[]
	estimated_minutes: number
	is_published: boolean
	question_count?: number
	created_at: string
	updated_at: string
}

export interface AdminListeningDetail {
	exercise: AdminListeningExercise
	questions: McqQuestion[]
}

export type ListeningFormInput = Omit<
	AdminListeningExercise,
	"id" | "question_count" | "created_at" | "updated_at"
>

// ─── Reading ─────────────────────────────────────────────

export interface AdminReadingExercise {
	id: string
	slug: string
	title: string
	description: string | null
	part: number
	passage: string
	vietnamese_translation: string | null
	keywords: string[]
	estimated_minutes: number
	is_published: boolean
	question_count?: number
	created_at: string
	updated_at: string
}

export interface AdminReadingDetail {
	exercise: AdminReadingExercise
	questions: McqQuestion[]
}

export type ReadingFormInput = Omit<
	AdminReadingExercise,
	"id" | "question_count" | "created_at" | "updated_at"
>

// ─── Writing ─────────────────────────────────────────────

export interface AdminWritingPrompt {
	id: string
	slug: string
	title: string
	description: string | null
	part: 1 | 2
	prompt: string
	min_words: number
	max_words: number
	required_points: string[]
	keywords: string[]
	sentence_starters: string[]
	sample_answer: string | null
	estimated_minutes: number
	is_published: boolean
	marker_count?: number
	created_at: string
	updated_at: string
}

export type WritingPromptFormInput = Omit<
	AdminWritingPrompt,
	"id" | "marker_count" | "created_at" | "updated_at"
>

export type MarkerSide = "left" | "right"

export interface AdminWritingMarker {
	id: string
	prompt_id: string
	match: string
	occurrence: number
	side: MarkerSide
	color: string
	label: string
	detail: string | null
	display_order: number
}

export type WritingMarkerFormInput = Omit<AdminWritingMarker, "id" | "prompt_id">

export interface AdminWritingDetail {
	prompt: AdminWritingPrompt
	markers: AdminWritingMarker[]
}

// ─── Speaking Drill ──────────────────────────────────────

export interface AdminSpeakingDrill {
	id: string
	slug: string
	title: string
	description: string | null
	level: "A1" | "A2" | "B1" | "B2" | "C1"
	estimated_minutes: number
	audio_url: string | null
	is_published: boolean
	sentence_count?: number
	created_at: string
	updated_at: string
}

export interface AdminSpeakingDrillSentence {
	id: string
	drill_id: string
	display_order: number
	text: string
	ipa: string | null
	translation: string | null
	word_count: number
	audio_start: number | null
	audio_end: number | null
}

export type SpeakingDrillFormInput = Omit<
	AdminSpeakingDrill,
	"id" | "sentence_count" | "created_at" | "updated_at"
>

export type SpeakingDrillSentenceFormInput = Omit<AdminSpeakingDrillSentence, "id" | "drill_id">

export interface AdminSpeakingDrillDetail {
	drill: AdminSpeakingDrill
	sentences: AdminSpeakingDrillSentence[]
}

// ─── Speaking Scenario ───────────────────────────────────

export interface AdminSpeakingScenario {
	id: string
	slug: string
	title: string
	level: "A1" | "A2" | "B1" | "B2" | "C1"
	character_name: string
	character_voice_label: string
	description: string
	system_prompt: string
	opening_line: string
	target_vocab: string[]
	estimated_minutes: number
	expected_turns: number
	is_published: boolean
	created_at: string
	updated_at: string
}

export type SpeakingScenarioFormInput = Omit<AdminSpeakingScenario, "id" | "created_at" | "updated_at">

// ─── Filters ─────────────────────────────────────────────

export interface ListFilters {
	page?: number
	per_page?: number
	q?: string
	is_published?: "all" | "yes" | "no"
	part?: number
	level?: string
}
