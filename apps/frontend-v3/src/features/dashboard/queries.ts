import { queryOptions } from "@tanstack/react-query"
import type { ActivityDay, ExamSessionResult, OverviewData, StreakData } from "#/features/dashboard/types"
import { type ApiResponse, api } from "#/lib/api"
import { skills } from "#/lib/skills"
import { getTargetBand } from "#/lib/vstep"

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

// Selectors

export function selectProfile(raw: ApiResponse<OverviewData>) {
	return raw.data.profile
}

export function selectSpider(raw: ApiResponse<OverviewData>) {
	return {
		chart: raw.data.chart,
		targetBand: getTargetBand(raw.data.profile.target_level),
		minTests: raw.data.stats.min_tests_required,
		totalTests: raw.data.stats.total_tests,
	}
}

export function selectGap(raw: ApiResponse<OverviewData>) {
	return {
		chart: raw.data.chart,
		targetBand: getTargetBand(raw.data.profile.target_level),
		targetLevel: raw.data.profile.target_level,
	}
}

export function selectTargetBand(raw: ApiResponse<OverviewData>) {
	return getTargetBand(raw.data.profile.target_level)
}

export function selectNextAction(raw: ApiResponse<OverviewData>) {
	const { stats, chart, profile } = raw.data
	const targetBand = getTargetBand(profile.target_level)

	let weakest = skills[0]
	if (chart) {
		let minGap = Number.POSITIVE_INFINITY
		for (const s of skills) {
			const score = chart[s.key] ?? 0
			const gap = score - targetBand
			if (gap < minGap) {
				minGap = gap
				weakest = s
			}
		}
	}

	return { streak: stats.streak, skill: weakest }
}

export function selectStats(raw: ApiResponse<OverviewData>) {
	const { stats, chart, profile } = raw.data
	const scores = chart
		? [chart.listening, chart.reading, chart.writing, chart.speaking].filter((v): v is number => v !== null)
		: []
	const avgBand =
		scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null
	return { ...stats, avgBand, targetLevel: profile.target_level }
}
