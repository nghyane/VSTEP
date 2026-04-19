import { queryOptions } from "@tanstack/react-query"
import { type ApiResponse, api } from "#/lib/api"
import type { SkillKey } from "#/lib/skills"
import { getTargetBand } from "#/lib/vstep"

// ─── Raw API types ───

export interface OverviewProfile {
	nickname: string
	target_level: string | null
	target_deadline: string | null
	days_until_exam: number | null
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

export interface StreakData {
	current_streak: number
	longest_streak: number
	today_sessions: number
	daily_goal: number
	last_active_date: string | null
}

export interface ActivityDay {
	date: string
	minutes: number
}

export interface ExamSessionResult {
	id: string
	mode: string
	is_full_test: boolean
	submitted_at: string
	scores: Record<SkillKey, number | null>
}

// ─── Queries ───

export const overviewQuery = queryOptions({
	queryKey: ["overview"],
	queryFn: () => api.get("overview").json<ApiResponse<OverviewData>>(),
})

export const streakQuery = queryOptions({
	queryKey: ["streak"],
	queryFn: () => api.get("streak").json<ApiResponse<StreakData>>(),
})

export const activityHeatmapQuery = queryOptions({
	queryKey: ["activity-heatmap"],
	queryFn: () => api.get("activity-heatmap").json<ApiResponse<ActivityDay[]>>(),
})

export const examSessionsQuery = queryOptions({
	queryKey: ["exam-sessions"],
	queryFn: () => api.get("exam-sessions").json<ApiResponse<ExamSessionResult[]>>(),
})

// ─── Selectors (for useQuery select option) ───

export function selectProfile(raw: ApiResponse<OverviewData>) {
	return raw.data.profile
}

export function selectStats(raw: ApiResponse<OverviewData>) {
	return raw.data.stats
}

export function selectSpider(raw: ApiResponse<OverviewData>) {
	const d = raw.data
	return {
		chart: d.chart,
		targetBand: getTargetBand(d.profile.target_level),
		minTests: d.stats.min_tests_required,
		totalTests: d.stats.total_tests,
	}
}

export function selectGap(raw: ApiResponse<OverviewData>) {
	const d = raw.data
	return {
		chart: d.chart,
		targetBand: getTargetBand(d.profile.target_level),
		targetLevel: d.profile.target_level,
	}
}

export function selectTargetBand(raw: ApiResponse<OverviewData>) {
	return getTargetBand(raw.data.profile.target_level)
}
