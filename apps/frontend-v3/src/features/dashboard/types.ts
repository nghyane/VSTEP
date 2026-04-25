import type { SkillKey } from "#/lib/skills"

export interface OverviewProfile {
	nickname: string
	target_level: string
	target_deadline: string | null
	days_until_exam: number | null
	entry_level: string | null
	predicted_level: string | null
}

export interface OverviewStats {
	total_tests: number
	min_tests_required: number
	total_study_minutes: number
	streak: number
	longest_streak: number
}

export interface OverviewChart {
	listening: number | null
	reading: number | null
	writing: number | null
	speaking: number | null
	sample_size: number
}

export interface OverviewData {
	profile: OverviewProfile
	stats: OverviewStats
	chart: OverviewChart | null
}

export interface StreakMilestone {
	days: number
	coins: number
	claimed: boolean
	claimed_at: string | null
}

export interface StreakData {
	current_streak: number
	longest_streak: number
	today_sessions: number
	daily_goal: number
	last_active_date: string | null
	milestones: StreakMilestone[]
}

export interface StreakClaimResult {
	milestone_days: number
	coins_granted: number
	balance_after: number
	claimed_at: string
}

export interface ActivityDay {
	date: string
	count: number
}

export interface ExamSessionResult {
	id: string
	mode: string
	is_full_test: boolean
	submitted_at: string
	scores: Record<SkillKey, number | null>
}
