export interface ListeningExerciseSummary {
	id: string
	slug: string
	title: string
	description: string | null
	part: number
	estimated_minutes: number | null
}

export interface ListeningExercise {
	id: string
	slug: string
	title: string
	description: string | null
	part: number
	audio_url: string
	transcript: string | null
	vietnamese_transcript: string | null
	word_timestamps: { word: string; offset: number; duration: number }[]
	keywords: string[]
	estimated_minutes: number | null
}

export interface McqQuestion {
	id: string
	display_order: number
	question: string
	options: string[]
	correct_index?: number
	explanation?: string
}

export interface ExerciseDetail {
	exercise: ListeningExercise
	questions: McqQuestion[]
}

export interface PracticeSession {
	id: string
	skill: string
	status: string
	started_at: string
}

export interface SubmitResult {
	score: number
	total: number
	items: { question_id: string; is_correct: boolean; correct_index: number; explanation: string }[]
	session: PracticeSession
}

export interface ReadingExercise {
	id: string
	slug: string
	title: string
	description: string | null
	part: number
	passage: string
	vietnamese_translation: string | null
	keywords: string[]
	estimated_minutes: number | null
}

export interface ReadingExerciseDetail {
	exercise: ReadingExercise
	questions: McqQuestion[]
}

export interface SupportResult {
	coins_spent: number
	balance_after: number
}

export interface WritingPrompt {
	id: string
	slug: string
	title: string
	part: number
	min_words: number
	max_words: number
	estimated_minutes: number | null
}

export interface WritingPromptDetail {
	id: string
	slug: string
	title: string
	description: string | null
	part: number
	prompt: string
	min_words: number
	max_words: number
	required_points: string[]
	keywords: string[]
	sentence_starters: string[]
	sample_answer: string | null
	sample_markers: SampleMarker[]
	estimated_minutes: number | null
}

export interface SampleMarker {
	id: string
	match: string
	occurrence: number
	side: string
	color: string
	label: string
	detail: string | null
}

export interface WritingSubmission {
	submission_id: string
	word_count: number
	submitted_at: string
	grading_status: string
}

/* ───── Shadowing ───── */

export interface ShadowingLesson {
	id: string
	slug: string
	title: string
	level: string
	segment_count: number
	estimated_minutes: number | null
}

export type WordAccuracy = "correct" | "wrong" | "close"

export interface ShadowingWordResult {
	word: string
	accuracy: WordAccuracy
	userSaid?: string
}

export interface ShadowingSegment {
	id: string
	index: number
	text: string
	ipa: string
	translation: string
	word_count: number
	audio_start: number
	audio_end: number
}

export interface ShadowingAttempt {
	transcript: string
	accuracy_percent: number
	correct_words: number
	total_words: number
	word_results: ShadowingWordResult[]
	audio_url: string | null
}

export interface ShadowingLessonDetail {
	id: string
	slug: string
	title: string
	level: string
	audio_url: string
	segments: ShadowingSegment[]
}

export interface WritingHistoryItem {
	id: string
	submitted_at: string
	word_count: number
	prompt: { id: string; slug: string; title: string; part: number } | null
}

/* ───── Speaking Conversation (AI roleplay) ─────
 * Spec proposal — pending BE. Layout review only.
 */

export interface ConversationScenario {
	id: string
	slug: string
	title: string
	level: string
	character_name: string
	character_voice: string
	description: string
	estimated_minutes: number
}

export interface ConversationVocabCheck {
	phrase: string
	used: boolean
}

export interface ConversationGrammarCorrection {
	wrong: string
	correct: string
	explanation: string
}

export interface ConversationTurnFeedback {
	word_count: { used: number; target: number }
	grammar_ok: boolean
	grammar_corrections: ConversationGrammarCorrection[]
	vocab_check: ConversationVocabCheck[]
	better: string | null
}

export type ConversationTurnRole = "ai" | "user"

export interface ConversationTurn {
	id: string
	role: ConversationTurnRole
	text: string
	feedback: ConversationTurnFeedback | null
	suggested_words: string[]
}

export interface ConversationSessionDetail {
	session_id: string
	scenario: ConversationScenario
	turns: ConversationTurn[]
}
