import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { buildListSearch } from "#/features/admin-practice/filters"
import type {
	AdminWritingDetail,
	AdminWritingMarker,
	AdminWritingPrompt,
	ListFilters,
	WritingMarkerFormInput,
	WritingPromptFormInput,
} from "#/features/admin-practice/types"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"

export const writingListQuery = (filters: ListFilters) =>
	queryOptions({
		queryKey: ["admin", "practice", "writing", "list", filters],
		queryFn: () =>
			api
				.get(`admin/practice/writing/prompts${buildListSearch(filters)}`)
				.json<PaginatedResponse<AdminWritingPrompt>>(),
		staleTime: 30_000,
	})

export const writingDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["admin", "practice", "writing", "detail", id],
		queryFn: () => api.get(`admin/practice/writing/prompts/${id}`).json<ApiResponse<AdminWritingDetail>>(),
	})

function invalidateList(qc: ReturnType<typeof useQueryClient>): void {
	qc.invalidateQueries({ queryKey: ["admin", "practice", "writing", "list"] })
}

function invalidateDetail(qc: ReturnType<typeof useQueryClient>, id: string): void {
	qc.invalidateQueries({ queryKey: ["admin", "practice", "writing", "detail", id] })
}

export function useCreateWriting() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: WritingPromptFormInput) =>
			api.post("admin/practice/writing/prompts", { json: input }).json<ApiResponse<AdminWritingPrompt>>(),
		onSuccess: () => invalidateList(qc),
	})
}

export function useUpdateWriting(id: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: Partial<WritingPromptFormInput>) =>
			api
				.patch(`admin/practice/writing/prompts/${id}`, { json: input })
				.json<ApiResponse<AdminWritingPrompt>>(),
		onSuccess: () => {
			invalidateList(qc)
			invalidateDetail(qc, id)
		},
	})
}

export function useDeleteWriting() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/practice/writing/prompts/${id}`),
		onSuccess: () => invalidateList(qc),
	})
}

export function useSetWritingPublished() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, published }: { id: string; published: boolean }) =>
			api
				.post(`admin/practice/writing/prompts/${id}/${published ? "publish" : "unpublish"}`)
				.json<ApiResponse<AdminWritingPrompt>>(),
		onSuccess: (_d, { id }) => {
			invalidateList(qc)
			invalidateDetail(qc, id)
		},
	})
}

export function useCreateWritingMarker(promptId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: WritingMarkerFormInput) =>
			api
				.post(`admin/practice/writing/prompts/${promptId}/markers`, { json: input })
				.json<ApiResponse<AdminWritingMarker>>(),
		onSuccess: () => invalidateDetail(qc, promptId),
	})
}

export function useUpdateWritingMarker(promptId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: Partial<WritingMarkerFormInput> }) =>
			api
				.patch(`admin/practice/writing/markers/${id}`, { json: input })
				.json<ApiResponse<AdminWritingMarker>>(),
		onSuccess: () => invalidateDetail(qc, promptId),
	})
}

export function useDeleteWritingMarker(promptId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/practice/writing/markers/${id}`),
		onSuccess: () => invalidateDetail(qc, promptId),
	})
}
