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
	/** Số lượt làm đã hoàn thành (submitted/graded/auto_submitted). Chỉ có ở list endpoint. */
	attempts_count?: number
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

export interface ExamSessionSummary {
	id: string
	exam_id: string | null
	exam_version_id: string
	mode: "full" | "custom"
	is_full_test: boolean
	status: "active" | "submitted" | "graded" | "auto_submitted"
	started_at: string
	submitted_at: string | null
	scores: unknown
}

export interface ActiveExamSession {
	id: string
	exam_id: string
	exam_title: string | null
	exam_version_id: string
	mode: "full" | "custom"
	selected_skills: SkillKey[]
	is_full_test: boolean
	started_at: string
	server_deadline_at: string
	status: "active"
	coins_charged: number
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

export interface WritingAnswerPayload {
	task_id: string
	text: string
	word_count: number
}

export interface SpeakingAnswerPayload {
	part_id: string
	audio_url: string
	duration_seconds: number
}

export interface SubmitSessionPayload {
	mcq_answers: McqAnswerPayload[]
	writing_answers?: WritingAnswerPayload[]
	speaking_answers?: SpeakingAnswerPayload[]
}

export interface GradingJobRef {
	submission_id: string
	job_id: string
	status: string
}

export interface SubmitSessionResult {
	session_id: string
	status: string
	submitted_at: string
	mcq: {
		score: number
		total: number
		items: Array<{
			item_ref_type: string
			item_ref_id: string
			selected_index: number
			correct_index: number
			is_correct: boolean
		}>
	}
	writing_jobs: GradingJobRef[]
	speaking_jobs: GradingJobRef[]
}

export interface McqDetailItem {
	item_ref_type: "exam_listening_item" | "exam_reading_item"
	item_ref_id: string
	selected_index: number | null
	correct_index: number
	is_correct: boolean
	answered_at: string | null
}

export interface SessionResultsData {
	session: ExamSessionSummary
	scores: unknown
	/** Aggregate MCQ: score (đã chấm) / total (số câu trong scope, câu không đáp tính sai). */
	mcq: { score: number; total: number }
	mcq_detail: McqDetailItem[]
	writing_feedback: unknown
	speaking_feedback: unknown
	listening_play_summary: Array<{ section_id: string; part: number; played: boolean }>
}

/** Derived UI model per skill — computed from ExamVersion */
export interface SkillSection {
	skill: SkillKey
	durationMinutes: number
	itemCount: number
	/** id of the underlying section/passage/task/part */
	sectionIds: string[]
}
