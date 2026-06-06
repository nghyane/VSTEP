import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { buildListSearch } from "#/features/admin-practice/filters"
import type {
	AdminSpeakingScenario,
	ListFilters,
	SpeakingScenarioFormInput,
} from "#/features/admin-practice/types"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"

export const speakingScenarioListQuery = (filters: ListFilters) =>
	queryOptions({
		queryKey: ["admin", "practice", "speaking-scenario", "list", filters],
		queryFn: () =>
			api
				.get(`admin/practice/speaking-scenarios${buildListSearch(filters)}`)
				.json<PaginatedResponse<AdminSpeakingScenario>>(),
		staleTime: 30_000,
	})

export const speakingScenarioDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["admin", "practice", "speaking-scenario", "detail", id],
		queryFn: () =>
			api.get(`admin/practice/speaking-scenarios/${id}`).json<ApiResponse<AdminSpeakingScenario>>(),
	})

function invalidateList(qc: ReturnType<typeof useQueryClient>): void {
	qc.invalidateQueries({ queryKey: ["admin", "practice", "speaking-scenario", "list"] })
}

function invalidateDetail(qc: ReturnType<typeof useQueryClient>, id: string): void {
	qc.invalidateQueries({ queryKey: ["admin", "practice", "speaking-scenario", "detail", id] })
}

export function useCreateSpeakingScenario() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: SpeakingScenarioFormInput) =>
			api
				.post("admin/practice/speaking-scenarios", { json: input })
				.json<ApiResponse<AdminSpeakingScenario>>(),
		onSuccess: () => invalidateList(qc),
	})
}

export function useUpdateSpeakingScenario(id: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: Partial<SpeakingScenarioFormInput>) =>
			api
				.patch(`admin/practice/speaking-scenarios/${id}`, { json: input })
				.json<ApiResponse<AdminSpeakingScenario>>(),
		onSuccess: () => {
			invalidateList(qc)
			invalidateDetail(qc, id)
		},
	})
}

export function useDeleteSpeakingScenario() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/practice/speaking-scenarios/${id}`),
		onSuccess: () => invalidateList(qc),
	})
}

export function useSetSpeakingScenarioPublished() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, published }: { id: string; published: boolean }) =>
			api
				.post(`admin/practice/speaking-scenarios/${id}/${published ? "publish" : "unpublish"}`)
				.json<ApiResponse<AdminSpeakingScenario>>(),
		onSuccess: (_d, { id }) => {
			invalidateList(qc)
			invalidateDetail(qc, id)
		},
	})
}
