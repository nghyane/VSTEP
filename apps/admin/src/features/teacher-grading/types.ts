export type TeacherGradingRequestStatus =
	| "pending_assignment"
	| "assigned"
	| "in_progress"
	| "completed"
	| "cancelled"
	| "rejected"

export interface TeacherGradingUser {
	id: string
	full_name: string | null
	email: string | null
}

export interface TeacherGradingProfile {
	id: string
	nickname: string
	account: TeacherGradingUser | null
}

export interface TeacherGradingCriterion {
	key: string
	label?: string
	name?: string
	name_vi?: string
	max_score?: number
	weight: number
	band_descriptors?: Record<string, string>
}

export interface TeacherGradingRubric {
	id: string
	title: string
	skill: "writing" | "speaking"
	task_type: string
	max_score: number
	criteria: TeacherGradingCriterion[]
}

export interface TeacherGradingResult {
	id: string
	overall_band: number
	criterion_scores: Array<{ key: string; score: number; weight: number; comment?: string }>
	feedback: Record<string, unknown> | null
	diagnostics?: TeacherGradingDiagnostics | null
	source?: "ai" | "teacher"
	teacher_id?: string | null
	ai_result_snapshot?: Record<string, unknown> | null
	submitted_at?: string | null
}

export interface TeacherGradingAnnotation {
	text: string
	type: "spelling" | "grammar" | "punctuation" | "style" | "other"
	severity: string
	category: string
	message: string
	suggestions: string[]
	rule_id: string
}

export interface TeacherGradingDiagnostics {
	summary?: {
		word_count: number | null
		sentence_count: number | null
		paragraph_count: number | null
		total_error_count: number | null
		grammar_error_count: number | null
		spelling_error_count: number | null
		punctuation_error_count: number | null
		linking_word_count: number | null
		unique_ratio: number | null
		avg_word_length: number | null
		readability_grade: number | null
	}
	annotations?: TeacherGradingAnnotation[]
	by_type?: Record<TeacherGradingAnnotation["type"], TeacherGradingAnnotation[]>
	word_requirement?: {
		minimum: number | null
		actual: number | null
		is_met: boolean | null
		missing: number | null
	}
	task_coverage?: {
		required_points: number
		covered_points: number | null
		coverage_ratio: number | null
		requirements: Array<{ text: string; met: boolean | null }>
	}
	format?: {
		letter_format_expected: boolean
		has_salutation: boolean | null
		has_closing: boolean | null
		tone?: {
			formal_count: number | null
			informal_count: number | null
			informal_words: string[] | null
		}
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
	}
	speech?: {
		transcript: string | null
		confidence: number | null
		speaking_rate: number | null
		pause_count: number | null
		word_count: number | null
	}
	fluency?: {
		speaking_rate: number | null
		pause_count: number | null
		word_count: number | null
	}
	pronunciation?: {
		overall: number | null
		raw: Record<string, unknown>
	}
	profanity?: {
		found: boolean
		words: string[]
		count: number
	}
}

export interface TeacherGradingAttempt {
	id: string
	profile_id: string
	skill: "writing" | "speaking"
	task_type: string
	source_type: string
	source_id: string
	prompt: Record<string, unknown>
	response_payload: Record<string, unknown>
	submitted_at: string
	rubric: TeacherGradingRubric | null
	result: TeacherGradingResult | null
}

export interface TeacherGradingRequestItem {
	id: string
	status: TeacherGradingRequestStatus
	student_note: string | null
	staff_note: string | null
	priority: number
	due_at: string | null
	requested_at: string
	assigned_at: string | null
	started_at: string | null
	completed_at: string | null
	cancelled_at: string | null
	profile: TeacherGradingProfile | null
	assigned_teacher: TeacherGradingUser | null
	assigned_by: TeacherGradingUser | null
	attempt: TeacherGradingAttempt | null
	teacher_result: TeacherGradingResult | null
}

export interface TeacherGradingListFilters {
	page?: number
	per_page?: number
	status?: TeacherGradingRequestStatus | "all"
	teacher_id?: string
	skill?: "writing" | "speaking" | "all"
}

export interface AssignTeacherGradingInput {
	teacher_id: string
	staff_note?: string
	due_at?: string
	priority?: number
}

export interface SubmitTeacherGradingInput {
	criterion_scores: Array<{ key: string; score: number; comment?: string }>
	feedback: {
		strengths: string[]
		improvements: string[]
		overall_comment?: string
	}
}
