import { queryOptions } from "@tanstack/react-query"
import type {
	OverviewData,
	ScoreTimelinePoint,
	SkillActivityDay,
	StreakData,
} from "#/features/dashboard/types"
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
	queryFn: () => api.get("activity-heatmap").json<ApiResponse<SkillActivityDay[]>>(),
})

export const examSessionsQuery = queryOptions({
	queryKey: ["exam-sessions"],
	queryFn: () =>
		api.get("exam-sessions").json<
			ApiResponse<
				{
					id: string
					mode: string
					is_full_test: boolean
					status: string
					submitted_at: string | null
					scores: Record<string, number | null> | null
				}[]
			>
		>(),
	select: (raw) => raw.data,
})

// Selectors

export function selectProfile(raw: ApiResponse<OverviewData>) {
	return raw.data.profile
}

export function selectSpider(raw: ApiResponse<OverviewData>) {
	const { scores, profile } = raw.data
	return {
		chart: scores.spider,
		targetBand: getTargetBand(profile.target_level),
		minTests: 5,
		totalTests: raw.data.stats.total_tests,
	}
}

export function selectScoreTimeline(raw: ApiResponse<OverviewData>): ScoreTimelinePoint[] {
	return raw.data.scores.timeline
}

export function selectGrowth(raw: ApiResponse<OverviewData>) {
	return raw.data.scores.growth
}

export function selectTargetBand(raw: ApiResponse<OverviewData>) {
	return getTargetBand(raw.data.profile.target_level)
}

export function selectNextAction(raw: ApiResponse<OverviewData>) {
	const { streak, scores, profile } = raw.data
	const targetBand = getTargetBand(profile.target_level)

	let weakest = skills[0]
	const chart = scores.spider
	if (chart) {
		let minGap = Number.POSITIVE_INFINITY
		for (const s of skills) {
			const score = chart[s.key] ?? 0
			const gap = (score ?? 0) - targetBand
			if (gap < minGap) {
				minGap = gap
				weakest = s
			}
		}
	}

	return { streak: streak.current, skill: weakest }
}

export function selectStats(raw: ApiResponse<OverviewData>) {
	const { scores, stats, profile } = raw.data
	const chart = scores.spider
	const scoreValues = chart
		? [chart.listening, chart.reading, chart.writing, chart.speaking].filter((v): v is number => v !== null)
		: []
	const avgBand =
		scoreValues.length > 0
			? Math.round((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 10) / 10
			: null
	return { ...stats, avgBand, targetLevel: profile.target_level }
}
