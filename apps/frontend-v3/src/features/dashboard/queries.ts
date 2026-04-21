import { queryOptions } from "@tanstack/react-query"
import { type ApiResponse, api } from "#/lib/api"
import { getTargetBand } from "#/lib/vstep"
import type { ActivityDay, ExamSessionResult, OverviewData, StreakData } from "#/features/dashboard/types"

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
