import type {
	AssessmentDiagnostics,
	AssessmentFeedback,
	AssessmentResultDisplay,
	CriterionScore,
} from "#/features/grading/types"
import type { Exam, ExamSessionSummary, ExamVersion, ListeningPlaySummaryItem, SkillKey } from "../types"

export interface McqDetailItem {
	item_ref_type: "exam_listening_item" | "exam_reading_item"
	item_ref_id: string
	selected_index: number | null
	correct_index: number
	answered: boolean
	is_correct: boolean
	answer_status: "correct" | "wrong" | "unanswered"
	answer_status_label: string
	answer_tone: "correct" | "wrong" | null
	selected_label: string | null
	correct_label: string
	selected_summary_label: string
	correct_summary_label: string
	correct_badge_label: string
	selected_badge_label: string
	answered_at: string | null
}

export type { AssessmentDiagnostics, AssessmentFeedback, AssessmentResultDisplay, CriterionScore }

export interface WritingFeedbackItem {
	submission_id: string | null
	attempt_id: string | null
	job_status: string | null
	score_status: ExamResultStatus
	feedback_status: ExamResultStatus
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
	submission_id: string | null
	attempt_id: string | null
	job_status: string | null
	score_status: ExamResultStatus
	feedback_status: ExamResultStatus
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

export type ExamResultStatus =
	| "pending"
	| "ready"
	| "partial"
	| "not_submitted"
	| "not_applicable"
	| "none"
	| "failed"

export interface ExamResultMcqSummary {
	correct: number
	total: number
	answered: number
	wrong: number
	unanswered: number
	score_on_10: number
}

export interface ExamResultOverallSummary {
	applicable: boolean
	reason: string | null
	band: number | null
	score_on_10: number | null
	vstep_level: string | null
	cefr_level: string | null
	result_label: string | null
}

export interface ExamResultDisplaySummary {
	band_title: string
	band_value: string
	total_score_title: string
	total_score_value: string
	pending_badge_label: string | null
}

export interface ExamResultSummary {
	score_status: ExamResultStatus
	feedback_status: ExamResultStatus
	has_pending_jobs: boolean
	has_failed_jobs: boolean
	display: ExamResultDisplaySummary
	overall: ExamResultOverallSummary
	mcq: ExamResultMcqSummary
}

export interface ExamResultReviewSkill {
	key: SkillKey
	label: string
	status: ExamResultStatus
	status_label: string
	score_label: string
	issue_count: number
	section_ids: string[]
}

export interface ExamResultReviewSection {
	id: string
	skill: SkillKey
	source_type: "exam_listening_part" | "exam_reading_passage" | "exam_writing_task" | "exam_speaking_part"
	source_id: string | null
	part: number
	display_order: number
	label: string
	short_label: string
	score_label: string
	status: ExamResultStatus
	status_label: string
	issue_count: number
}

export interface ExamResultReview {
	skills: ExamResultReviewSkill[]
	sections: ExamResultReviewSection[]
}

export interface SessionResultsData {
	session: ExamSessionSummary
	exam: Pick<Exam, "id" | "title"> | null
	version: ExamVersion | null
	summary: ExamResultSummary
	review: ExamResultReview
	mcq_detail: McqDetailItem[]
	writing_feedback: WritingFeedbackItem[]
	speaking_feedback: SpeakingFeedbackItem[]
	listening_play_summary: ListeningPlaySummaryItem[]
}
