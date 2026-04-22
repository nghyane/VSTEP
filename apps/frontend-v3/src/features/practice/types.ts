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

export interface SpeakingDrill {
	id: string
	slug: string
	title: string
	level: string
	estimated_minutes: number | null
}

export interface SpeakingDrillDetail {
	id: string
	slug: string
	title: string
	description: string | null
	level: string
	estimated_minutes: number | null
	sentences: { id: string; text: string; translation: string }[]
}

export interface SpeakingTask {
	id: string
	slug: string
	title: string
	part: number
	task_type: string
	speaking_seconds: number
}

export interface SpeakingTaskContent {
	topics: { name: string; questions: string[] }[]
}

export interface SpeakingTaskDetail {
	id: string
	slug: string
	title: string
	part: number
	task_type: string
	content: SpeakingTaskContent
	speaking_seconds: number
}
