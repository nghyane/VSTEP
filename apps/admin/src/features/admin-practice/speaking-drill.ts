import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { buildListSearch } from "#/features/admin-practice/filters"
import type {
	AdminSpeakingDrill,
	AdminSpeakingDrillDetail,
	AdminSpeakingDrillSentence,
	ListFilters,
	SpeakingDrillFormInput,
	SpeakingDrillSentenceFormInput,
} from "#/features/admin-practice/types"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"

export const speakingDrillListQuery = (filters: ListFilters) =>
	queryOptions({
		queryKey: ["admin", "practice", "speaking-drill", "list", filters],
		queryFn: () =>
			api
				.get(`admin/practice/speaking-drills${buildListSearch(filters)}`)
				.json<PaginatedResponse<AdminSpeakingDrill>>(),
		staleTime: 30_000,
	})

export const speakingDrillDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["admin", "practice", "speaking-drill", "detail", id],
		queryFn: () =>
			api.get(`admin/practice/speaking-drills/${id}`).json<ApiResponse<AdminSpeakingDrillDetail>>(),
	})

function invalidateList(qc: ReturnType<typeof useQueryClient>): void {
	qc.invalidateQueries({ queryKey: ["admin", "practice", "speaking-drill", "list"] })
}

function invalidateDetail(qc: ReturnType<typeof useQueryClient>, id: string): void {
	qc.invalidateQueries({ queryKey: ["admin", "practice", "speaking-drill", "detail", id] })
}

export function useCreateSpeakingDrill() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: SpeakingDrillFormInput) =>
			api.post("admin/practice/speaking-drills", { json: input }).json<ApiResponse<AdminSpeakingDrill>>(),
		onSuccess: () => invalidateList(qc),
	})
}

export function useUpdateSpeakingDrill(id: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: Partial<SpeakingDrillFormInput>) =>
			api
				.patch(`admin/practice/speaking-drills/${id}`, { json: input })
				.json<ApiResponse<AdminSpeakingDrill>>(),
		onSuccess: () => {
			invalidateList(qc)
			invalidateDetail(qc, id)
		},
	})
}

export function useDeleteSpeakingDrill() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/practice/speaking-drills/${id}`),
		onSuccess: () => invalidateList(qc),
	})
}

export function useSetSpeakingDrillPublished() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, published }: { id: string; published: boolean }) =>
			api
				.post(`admin/practice/speaking-drills/${id}/${published ? "publish" : "unpublish"}`)
				.json<ApiResponse<AdminSpeakingDrill>>(),
		onSuccess: (_d, { id }) => {
			invalidateList(qc)
			invalidateDetail(qc, id)
		},
	})
}

export function useCreateSpeakingDrillSentence(drillId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: SpeakingDrillSentenceFormInput) =>
			api
				.post(`admin/practice/speaking-drills/${drillId}/sentences`, { json: input })
				.json<ApiResponse<AdminSpeakingDrillSentence>>(),
		onSuccess: () => invalidateDetail(qc, drillId),
	})
}

export function useUpdateSpeakingDrillSentence(drillId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: Partial<SpeakingDrillSentenceFormInput> }) =>
			api
				.patch(`admin/practice/speaking-drill-sentences/${id}`, { json: input })
				.json<ApiResponse<AdminSpeakingDrillSentence>>(),
		onSuccess: () => invalidateDetail(qc, drillId),
	})
}

export function useDeleteSpeakingDrillSentence(drillId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/practice/speaking-drill-sentences/${id}`),
		onSuccess: () => invalidateDetail(qc, drillId),
	})
}
