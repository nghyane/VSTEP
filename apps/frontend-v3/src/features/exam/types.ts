export type SkillKey = "listening" | "reading" | "writing" | "speaking"
export type SkillScores = Record<SkillKey, number | null>

// ─── Exam catalog ───

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

// ─── Exam version content ───

export interface ExamVersionMcqItem {
	id: string
	display_order: number
	stem: string
	options: [string, string, string, string]
	correct_index?: number
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

export type ExamVersionSummary = Pick<ExamVersion, "id" | "version_number" | "is_active" | "published_at">

export interface ExamSkillSummary {
	skill: SkillKey
	duration_minutes: number
	item_count: number
	part_count: number
}

export type ExamResultStatus =
	| "pending"
	| "ready"
	| "partial"
	| "not_submitted"
	| "not_applicable"
	| "none"
	| "failed"

export interface ExamScoringSource {
	title: string
	issuer: string
	url: string | null
}

export interface ExamScoringLevelRule {
	code: "B1" | "B2" | "C1" | null
	label: string
	vietnamese_level: number | null
	min_score: number
	max_score: number
}

export interface ExamScoringRules {
	scheme: "vstep_3_5"
	name: string
	skill_scale: {
		min: number
		max: number
		step: number
		rounding: "nearest_half"
	}
	overall: {
		required_skills: SkillKey[]
		formula: string
	}
	levels: ExamScoringLevelRule[]
	sources: ExamScoringSource[]
}

export interface ExamResultLevel {
	code: "B1" | "B2" | "C1"
	label: string
	vietnamese_level: number
	min_score: number
	max_score: number
}

export interface ExamOverallScoreSummary {
	applicable: boolean
	reason: string | null
	band: number | null
	score_on_10: number | null
	max_score: number
	vstep_level: string | null
	level: ExamResultLevel | null
	result_label: string | null
}

export interface ExamSkillScoreSummary {
	key: SkillKey
	label: string
	status: ExamResultStatus
	status_label?: string
	score_on_10: number | null
	max_score: number
	weight_percent: number
	contributes_to_overall: boolean
	raw?: {
		correct: number
		total: number
		wrong: number
	} | null
}

export interface ExamSessionScoreSummary {
	score_status: ExamResultStatus
	scoring: ExamScoringRules
	overall: ExamOverallScoreSummary
	skills: ExamSkillScoreSummary[]
}

// ─── Session & Room ───

export type ExamSessionStatus = "active" | "submitted" | "auto_submitted" | "grading" | "graded" | "abandoned"

export interface ExamSessionSummary {
	id: string
	exam_id: string | null
	exam_version_id: string
	mode: "full" | "custom"
	selected_skills: SkillKey[]
	is_full_test: boolean
	status: ExamSessionStatus
	started_at: string
	submitted_at: string | null
	server_deadline_at: string
	scores: Record<SkillKey, number | null> | null
	result_summary: ExamSessionScoreSummary | null
}

export interface ExamOverview {
	exam: Exam
	version: ExamVersionSummary
	skill_summaries: Record<SkillKey, ExamSkillSummary>
	pricing: {
		full_test_cost_coins: number
		custom_per_skill_coins: number
	}
	attempt_state: {
		active_session: ExamSessionSummary | null
		active_current_version_session: ExamSessionSummary | null
		history: ExamSessionSummary[]
	}
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
	status: ExamSessionStatus
	coins_charged: number
	remaining_seconds?: number
}

export interface ListeningPlaySummaryItem {
	section_id: string
	part: number
	played: boolean
	played_at: string | null
}

export interface LogListeningPlayedResult extends ListeningPlaySummaryItem {
	already_played: boolean
}

export interface ExamRoomData {
	session: ExamSessionData
	exam: Exam
	version: ExamVersion
	draft: ExamDraft | null
	listening_play_summary: ListeningPlaySummaryItem[]
	actions: {
		can_answer: boolean
		can_submit: boolean
		can_view_result: boolean
	}
}

// ─── Answer / Submit / Draft ───

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

// ─── Derived UI ───

export interface SkillSection {
	skill: SkillKey
	durationMinutes: number
	itemCount: number
	sectionIds: string[]
}

// ─── Result types (re-export) ───

export type {
	ExamResultDisplaySummary,
	ExamResultMcqSummary,
	ExamResultOverallSummary,
	ExamResultReview,
	ExamResultReviewSection,
	ExamResultReviewSkill,
	ExamResultSummary,
	ExamScoreInsight,
	McqDetailItem,
	SessionResultsData,
	SpeakingFeedbackItem,
	WritingFeedbackItem,
} from "./types/result"
