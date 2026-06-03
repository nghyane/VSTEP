export type SkillKey = "listening" | "reading" | "writing" | "speaking"
export type SkillScores = Record<SkillKey, number | null>

export interface ExamBase {
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

export interface Exam extends ExamBase {}

export interface ExamListItem extends ExamBase {
	attempts_count: number
	user_state: ExamListUserState
}

export type ExamListUserStatus = "not_started" | "in_progress" | "submitted"

export type ExamListStatusTone = "primary" | "success" | "warning"

export type ExamListPrimaryAction = "start" | "continue" | "restart"

interface ExamListUserStateBase<
	TStatus extends ExamListUserStatus,
	TTone extends ExamListStatusTone,
	TAction extends ExamListPrimaryAction,
> {
	status: TStatus
	status_label: string
	status_tone: TTone
	primary_action: TAction
	primary_action_label: string
}

export type ExamNotStartedUserState = ExamListUserStateBase<"not_started", "success", "start"> & {
	active_session_id: null
	deadline_at: null
	selected_skills: null
	progress_label: null
	session_count: 0
}

export type ExamInProgressUserState = ExamListUserStateBase<"in_progress", "warning", "continue"> & {
	active_session_id: string
	deadline_at: string
	selected_skills: SkillKey[]
	progress_label: string
	session_count: 0
}

export type ExamSubmittedUserState = ExamListUserStateBase<"submitted", "primary", "restart"> & {
	active_session_id: null
	deadline_at: null
	selected_skills: null
	progress_label: null
	session_count: number
}

export type ExamListUserState = ExamNotStartedUserState | ExamInProgressUserState | ExamSubmittedUserState

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
	selected_skills: SkillKey[]
	is_full_test: boolean
	status: "active" | "submitted" | "auto_submitted" | "grading" | "graded"
	started_at: string
	submitted_at: string | null
	server_deadline_at: string
	/** Per-skill scores (0–10). null khi session chưa terminal hoặc skill chưa graded. */
	scores: Record<SkillKey, number | null> | null
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
	status: "active" | "submitted" | "auto_submitted" | "grading" | "graded"
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
	audio_key: string
	duration_seconds: number
}

export interface SubmitSessionPayload {
	mcq_answers: McqAnswerPayload[]
	writing_answers?: WritingAnswerPayload[]
	speaking_answers?: SpeakingAnswerPayload[]
}

export interface ExamDraftMcq {
	item_ref_id: string
	selected_index: number
}

export interface ExamDraftWriting {
	task_id: string
	text: string
}

export interface ExamDraftSpeakingMark {
	part_id: string
	audio_key?: string | null
	audio_url?: string | null
	duration_seconds?: number | null
}

export interface ExamDraftPayload {
	skill_idx: number
	mcq_answers: ExamDraftMcq[]
	writing_answers: ExamDraftWriting[]
	speaking_marks: ExamDraftSpeakingMark[]
}

export interface ExamDraft extends ExamDraftPayload {
	session_id: string
	saved_at: string
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

import type {
	AssessmentDiagnostics,
	AssessmentFeedback,
	AssessmentResultDisplay,
	CriterionScore,
} from "#/features/grading/types"

export interface WritingFeedbackItem {
	submission_id: string
	attempt_id: string | null
	task_id: string
	word_count: number
	text: string
	overall_band: number | null
	criterion_scores: CriterionScore[] | null
	caps_applied?: unknown
	display?: AssessmentResultDisplay | null
	diagnostics?: AssessmentDiagnostics | null
	feedback: AssessmentFeedback | null
	calculation_trace: unknown
}

export interface SpeakingFeedbackItem {
	submission_id: string
	attempt_id: string | null
	part_id: string
	audio_url: string | null
	transcript: string | null
	overall_band: number | null
	criterion_scores: CriterionScore[] | null
	caps_applied?: unknown
	display?: AssessmentResultDisplay | null
	diagnostics?: AssessmentDiagnostics | null
	feedback: AssessmentFeedback | null
	calculation_trace: unknown
}

export interface ExamResultSummary {
	mcq_score: number
	mcq_total: number
	score_on_10: number
	overall_band: number | null
	level: string
	has_pending_ai: boolean
}

export interface ExamResultPerformanceRow {
	skill: SkillKey
	label: string
	score_type: "accuracy" | "band"
	status: "graded" | "pending" | "not_submitted"
	total: number
	correct: number | null
	wrong: number | null
	accuracy_pct: number | null
	band: number | null
}

export interface SessionResultsData {
	session: ExamSessionSummary
	exam: Pick<Exam, "id" | "title"> | null
	scores: SkillScores | null
	summary: ExamResultSummary
	performance_rows: ExamResultPerformanceRow[]
	overall_band: number | null
	level: string
	/** Aggregate MCQ: score (đã chấm) / total (số câu trong scope, câu không đáp tính sai). */
	mcq: { score: number; total: number }
	mcq_detail: McqDetailItem[]
	writing_feedback: WritingFeedbackItem[]
	speaking_feedback: SpeakingFeedbackItem[]
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
