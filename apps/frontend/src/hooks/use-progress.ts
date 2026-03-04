import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type {
	ActivityResponse,
	ProgressOverview,
	ProgressSkillDetail,
	SpiderChartResponse,
} from "@/types/api"

function useProgress() {
	return useQuery({
		queryKey: ["progress"],
		queryFn: () => api.get<ProgressOverview>("/api/progress"),
	})
}

function useActivity(days = 7) {
	return useQuery({
		queryKey: ["progress", "activity", days],
		queryFn: () => api.get<ActivityResponse>(`/api/progress/activity?days=${days}`),
	})
}

function useSpiderChart() {
	return useQuery({
		queryKey: ["progress", "spider-chart"],
		queryFn: () => api.get<SpiderChartResponse>("/api/progress/spider-chart"),
	})
}

function useSkillDetail(skill: string) {
	return useQuery({
		queryKey: ["progress", skill],
		queryFn: () => api.get<ProgressSkillDetail>(`/api/progress/${skill}`),
		enabled: !!skill,
	})
}

function useCreateGoal() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (body: { targetBand: string; deadline: string; dailyStudyTimeMinutes?: number }) =>
			api.post<import("@/types/api").Goal>("/api/progress/goals", body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["progress"] })
		},
	})
}

function useUpdateGoal() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({
			id,
			...body
		}: {
			id: string
			targetBand?: string
			deadline?: string
			dailyStudyTimeMinutes?: number
		}) => api.patch<import("@/types/api").Goal>(`/api/progress/goals/${id}`, body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["progress"] })
		},
	})
}

function useDeleteGoal() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			api.delete<{ id: string; deleted: boolean }>(`/api/progress/goals/${id}`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["progress"] })
		},
	})
}

export {
	useActivity,
	useCreateGoal,
	useDeleteGoal,
	useProgress,
	useSkillDetail,
	useSpiderChart,
	useUpdateGoal,
}
