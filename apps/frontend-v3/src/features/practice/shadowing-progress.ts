import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { type ApiResponse, api } from "#/lib/api"

interface SegmentProgress {
	segment_index: number
	accuracy_percent: number
}

export type ShadowingProgressData = Record<string, SegmentProgress[]>

export const shadowingProgressQuery = queryOptions({
	queryKey: ["practice", "speaking", "shadowing", "progress"],
	queryFn: () => api.get("practice/speaking/shadowing/progress").json<ApiResponse<ShadowingProgressData>>(),
})

export function useMarkShadowingDone() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (params: { lesson_id: string; segment_index: number; accuracy_percent: number }) =>
			api.post("practice/speaking/shadowing/progress", { json: params }).json(),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["practice", "speaking", "shadowing", "progress"] })
		},
	})
}
