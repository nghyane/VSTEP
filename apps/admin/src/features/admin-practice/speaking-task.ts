import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { buildListSearch } from "#/features/admin-practice/filters"
import type { AdminSpeakingTask, ListFilters, SpeakingTaskFormInput } from "#/features/admin-practice/types"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"

export const speakingTaskListQuery = (filters: ListFilters) =>
	queryOptions({
		queryKey: ["admin", "practice", "speaking-task", "list", filters],
		queryFn: () =>
			api
				.get(`admin/practice/speaking-tasks${buildListSearch(filters)}`)
				.json<PaginatedResponse<AdminSpeakingTask>>(),
		staleTime: 30_000,
	})

export const speakingTaskDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["admin", "practice", "speaking-task", "detail", id],
		queryFn: () => api.get(`admin/practice/speaking-tasks/${id}`).json<ApiResponse<AdminSpeakingTask>>(),
	})

function invalidateList(qc: ReturnType<typeof useQueryClient>): void {
	qc.invalidateQueries({ queryKey: ["admin", "practice", "speaking-task", "list"] })
}

function invalidateDetail(qc: ReturnType<typeof useQueryClient>, id: string): void {
	qc.invalidateQueries({ queryKey: ["admin", "practice", "speaking-task", "detail", id] })
}

export function useCreateSpeakingTask() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: SpeakingTaskFormInput) =>
			api.post("admin/practice/speaking-tasks", { json: input }).json<ApiResponse<AdminSpeakingTask>>(),
		onSuccess: () => invalidateList(qc),
	})
}

export function useUpdateSpeakingTask(id: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: Partial<SpeakingTaskFormInput>) =>
			api
				.patch(`admin/practice/speaking-tasks/${id}`, { json: input })
				.json<ApiResponse<AdminSpeakingTask>>(),
		onSuccess: () => {
			invalidateList(qc)
			invalidateDetail(qc, id)
		},
	})
}

export function useDeleteSpeakingTask() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/practice/speaking-tasks/${id}`),
		onSuccess: () => invalidateList(qc),
	})
}

export function useSetSpeakingTaskPublished() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, published }: { id: string; published: boolean }) =>
			api
				.post(`admin/practice/speaking-tasks/${id}/${published ? "publish" : "unpublish"}`)
				.json<ApiResponse<AdminSpeakingTask>>(),
		onSuccess: (_d, { id }) => {
			invalidateList(qc)
			invalidateDetail(qc, id)
		},
	})
}
