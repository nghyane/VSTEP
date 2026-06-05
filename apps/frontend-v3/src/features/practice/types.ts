import type { AssessmentDiagnostics } from "#/features/grading/types"

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

export interface ExerciseFeedbackPayload {
	content_type: string
	content_id: string
	rating: number
	comment?: string
}

export interface ExerciseFeedback {
	id: string
	content_type: string
	content_id: string
	rating: number
	comment: string | null
	created_at: string
	updated_at: string
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
	attempt_id: string
	job_id: string
	word_count: number
	submitted_at: string
	grading_status: string
}

export interface WritingRealtimeDiagnostics {
	text_hash: string
	language: {
		is_english: boolean
		confidence: number
		non_ascii_letter_ratio: number
	}
	diagnostics: AssessmentDiagnostics & {
		data_status?: {
			rule_metrics_available: boolean
			language_tool_checked: boolean
		}
		format?: {
			letter_format_expected: boolean
			has_salutation: boolean | null
			has_closing: boolean | null
			tone: {
				formal_count: number | null
				informal_count: number | null
				informal_words: string[] | null
			} | null
		}
		cohesion?: {
			linking_word_count: number | null
			sentence_variety: number | null
		}
		vocabulary_profile?: {
			cefr_weighted_avg: number | null
			cefr_advanced_ratio: number | null
			cefr_vocab_count: number | null
			complex_vocab_count: number | null
		} | null
	}
	readiness: {
		status: "ready" | "needs_work"
		label: string
		reasons: Array<{
			code: string
			message: string
		}>
	}
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
	attempt_id: string
	submitted_at: string
	word_count: number
	prompt: { id: string; slug: string; title: string; part: number } | null
}

/* ───── Learning Path ───── */

export interface LearningPathSkill {
	skill: string
	level: string
	band: number | null
	coverage_pct: number | null
	total_items: number | null
	completed_items: number | null
	suggestion: string | null
}

export interface LearningPathData {
	current_level: string
	target_level: string
	days_remaining: number | null
	skills: LearningPathSkill[]
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
	expected_turns?: number
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
	better_ipa: string | null
	user_ipa: string | null
	profanity?: {
		found: boolean
		words: string[]
		count: number
	}
}

export type ConversationTurnRole = "ai" | "user"

export interface ConversationTurn {
	id: string
	role: ConversationTurnRole
	text: string
	ipa: string | null
	feedback: ConversationTurnFeedback | null
	suggested_words: string[]
}

export interface ConversationSessionDetail {
	session_id: string
	scenario: ConversationScenario
	turns: ConversationTurn[]
}

export interface ConversationHistoryItem {
	id: string
	scenario: { id: string; title: string; level: string }
	ended_at: string
	duration_seconds: number
	user_turn_count: number
	vocab_used_pct: number
}
