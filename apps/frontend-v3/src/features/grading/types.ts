export interface Improvement {
	message: string
	explanation: string
}

export interface Rewrite {
	original: string
	improved: string
	reason: string
}

export interface WritingGradingResult {
	id: string
	rubric_scores: {
		task_achievement: number
		coherence: number
		lexical: number
		grammar: number
	}
	overall_band: number
	strengths: string[]
	improvements: Improvement[]
	rewrites: Rewrite[]
	annotations: unknown[]
	created_at: string
}

export interface SpeakingGradingResult {
	id: string
	rubric_scores: {
		fluency: number
		pronunciation: number
		content: number
		vocab: number
		grammar: number
	}
	overall_band: number
	strengths: string[]
	improvements: Improvement[]
	pronunciation_report: { accuracy_score: number } | null
	transcript: string | null
	created_at: string
}

export interface GradingJob {
	id: string
	submission_type: string
	submission_id: string
	status: "pending" | "processing" | "ready" | "failed"
	attempts: number
	last_error: string | null
	started_at: string | null
	completed_at: string | null
}
