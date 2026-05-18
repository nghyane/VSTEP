import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { buildListSearch } from "#/features/admin-practice/filters"
import type {
	AdminListeningDetail,
	AdminListeningExercise,
	ListeningFormInput,
	ListFilters,
	McqQuestion,
	McqQuestionFormInput,
} from "#/features/admin-practice/types"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"

export const listeningListQuery = (filters: ListFilters) =>
	queryOptions({
		queryKey: ["admin", "practice", "listening", "list", filters],
		queryFn: () =>
			api
				.get(`admin/practice/listening/exercises${buildListSearch(filters)}`)
				.json<PaginatedResponse<AdminListeningExercise>>(),
		staleTime: 30_000,
	})

export const listeningDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["admin", "practice", "listening", "detail", id],
		queryFn: () =>
			api.get(`admin/practice/listening/exercises/${id}`).json<ApiResponse<AdminListeningDetail>>(),
	})

function invalidateList(qc: ReturnType<typeof useQueryClient>): void {
	qc.invalidateQueries({ queryKey: ["admin", "practice", "listening", "list"] })
}

function invalidateDetail(qc: ReturnType<typeof useQueryClient>, id: string): void {
	qc.invalidateQueries({ queryKey: ["admin", "practice", "listening", "detail", id] })
}

export function useCreateListening() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: ListeningFormInput) =>
			api
				.post("admin/practice/listening/exercises", { json: input })
				.json<ApiResponse<AdminListeningExercise>>(),
		onSuccess: () => invalidateList(qc),
	})
}

export function useUpdateListening(id: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: Partial<ListeningFormInput>) =>
			api
				.patch(`admin/practice/listening/exercises/${id}`, { json: input })
				.json<ApiResponse<AdminListeningExercise>>(),
		onSuccess: () => {
			invalidateList(qc)
			invalidateDetail(qc, id)
		},
	})
}

export function useDeleteListening() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/practice/listening/exercises/${id}`),
		onSuccess: () => invalidateList(qc),
	})
}

export function useSetListeningPublished() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, published }: { id: string; published: boolean }) =>
			api
				.post(`admin/practice/listening/exercises/${id}/${published ? "publish" : "unpublish"}`)
				.json<ApiResponse<AdminListeningExercise>>(),
		onSuccess: (_d, { id }) => {
			invalidateList(qc)
			invalidateDetail(qc, id)
		},
	})
}

export function useCreateListeningQuestion(exerciseId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: McqQuestionFormInput) =>
			api
				.post(`admin/practice/listening/exercises/${exerciseId}/questions`, { json: input })
				.json<ApiResponse<McqQuestion>>(),
		onSuccess: () => invalidateDetail(qc, exerciseId),
	})
}

export function useUpdateListeningQuestion(exerciseId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: Partial<McqQuestionFormInput> }) =>
			api.patch(`admin/practice/listening/questions/${id}`, { json: input }).json<ApiResponse<McqQuestion>>(),
		onSuccess: () => invalidateDetail(qc, exerciseId),
	})
}

export function useDeleteListeningQuestion(exerciseId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/practice/listening/questions/${id}`),
		onSuccess: () => invalidateDetail(qc, exerciseId),
	})
}
