import type { SkillKey } from "#/lib/skills"

export interface OverviewProfile {
	nickname: string
	target_level: string
	target_deadline: string | null
	days_until_exam: number | null
	entry_level: string | null
	predicted_level: string | null
}

export interface OverviewStreak {
	current: number
	longest: number
	last_active_date: string | null
	today_active: boolean
}

export interface ScoreSpider {
	listening: number | null
	reading: number | null
	writing: number | null
	speaking: number | null
	sample_size: number
}

export interface ScoreTimelinePoint {
	date: string
	listening: number | null
	reading: number | null
	writing: number | null
	speaking: number | null
}

export interface ScoreGrowth {
	first: number | null
	latest: number | null
	change: number | null
	trend: string
}

export interface OverviewHeatmap {
	weeks: number
	days: SkillActivityDay[]
}

export interface OverviewStats {
	total_study_minutes: number
	total_tests: number
}

export interface OverviewData {
	profile: OverviewProfile
	streak: OverviewStreak
	heatmap: OverviewHeatmap
	scores: {
		spider: ScoreSpider | null
		timeline: ScoreTimelinePoint[]
		growth: Record<SkillKey, ScoreGrowth>
	}
	stats: OverviewStats
}

export interface StreakMilestone {
	days: number
	coins: number
	claimed: boolean
	claimed_at: string | null
}

export interface StreakData {
	current: number
	longest: number
	last_active_date: string | null
	today_active: boolean
	daily_goal: number
	milestones: StreakMilestone[]
}

export interface StreakClaimResult {
	milestone_days: number
	coins_granted: number
	balance_after: number
	claimed_at: string
}

export interface SkillActivityDay {
	date: string
	listening: number
	reading: number
	writing: number
	speaking: number
	vocab: number
	exam: number
}

export interface ExamSessionResult {
	id: string
	mode: string
	is_full_test: boolean
	status: string
	submitted_at: string | null
	scores: Record<SkillKey, number | null> | null
}
