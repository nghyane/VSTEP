export interface ListeningExercise {
	id: string
	slug: string
	title: string
	description: string | null
	part: number
	audio_url: string
	transcript: string | null
	vietnamese_transcript: string | null
	word_timestamps: { word: string; start: number; end: number }[]
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

export interface SupportResult {
	coins_spent: number
	balance_after: number
}
