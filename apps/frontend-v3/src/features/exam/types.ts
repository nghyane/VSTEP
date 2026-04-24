export type SkillKey = "listening" | "reading" | "writing" | "speaking"

export interface AppConfig {
	wallet: {
		onboarding_initial_coins: number
	}
	pricing: {
		exam: {
			full_test_cost_coins: number
			custom_per_skill_coins: number
			max_cost_coins: number
		}
		practice: {
			support_level_costs: Record<string, number>
		}
	}
}

export interface Exam {
	id: string
	slug: string
	title: string
	source_school: string | null
	tags: string[]
	total_duration_minutes: number
	is_published: boolean
	created_at: string
	updated_at: string
}

export interface ExamVersionMcqItem {
	id: string
	display_order: number
	stem: string
	options: [string, string, string, string]
	correct_index: number
}

export interface ExamVersionListeningSection {
	id: string
	part: number
	part_title: string
	duration_minutes: number
	audio_url: string
	transcript: string | null
	display_order: number
	items: ExamVersionMcqItem[]
}

export interface ExamVersionReadingPassage {
	id: string
	part: number
	title: string
	duration_minutes: number
	passage: string
	display_order: number
	items: ExamVersionMcqItem[]
}

export interface ExamVersionWritingTask {
	id: string
	part: number
	task_type: string
	duration_minutes: number
	prompt: string
	min_words: number
	display_order: number
}

export interface ExamVersionSpeakingPart {
	id: string
	part: number
	type: string
	duration_minutes: number
	speaking_seconds: number
	content: Record<string, unknown>
	display_order: number
}

export interface ExamVersion {
	id: string
	version_number: number
	is_active: boolean
	published_at: string
	listening_sections: ExamVersionListeningSection[]
	reading_passages: ExamVersionReadingPassage[]
	writing_tasks: ExamVersionWritingTask[]
	speaking_parts: ExamVersionSpeakingPart[]
}

export interface ExamDetail {
	exam: Exam
	version: ExamVersion
}

export interface StartSessionPayload {
	mode: "full" | "custom"
	selected_skills?: SkillKey[]
	time_extension_factor?: number
}

export interface StartSessionResult {
	session_id: string
	server_deadline_at: string
	coins_charged: number
	status: string
}

export interface ExamSessionData {
	id: string
	profile_id: string
	exam_version_id: string
	mode: "full" | "custom"
	selected_skills: SkillKey[]
	is_full_test: boolean
	time_extension_factor: number
	started_at: string
	server_deadline_at: string
	submitted_at: string | null
	status: "active" | "submitted" | "graded"
	coins_charged: number
}

export interface McqAnswerPayload {
	item_ref_type: string
	item_ref_id: string
	selected_index: number
}

export interface SubmitSessionPayload {
	mcq_answers: McqAnswerPayload[]
}

export interface SubmitSessionResult {
	session_id: string
	status: string
	mcq_score: number
	mcq_total: number
	submitted_at: string
}

/** Derived UI model per skill — computed from ExamVersion */
export interface SkillSection {
	skill: SkillKey
	durationMinutes: number
	itemCount: number
	/** id of the underlying section/passage/task/part */
	sectionIds: string[]
}
