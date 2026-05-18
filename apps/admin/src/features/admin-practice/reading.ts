import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { buildListSearch } from "#/features/admin-practice/filters"
import type {
	AdminReadingDetail,
	AdminReadingExercise,
	ListFilters,
	McqQuestion,
	McqQuestionFormInput,
	ReadingFormInput,
} from "#/features/admin-practice/types"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"

export const readingListQuery = (filters: ListFilters) =>
	queryOptions({
		queryKey: ["admin", "practice", "reading", "list", filters],
		queryFn: () =>
			api
				.get(`admin/practice/reading/exercises${buildListSearch(filters)}`)
				.json<PaginatedResponse<AdminReadingExercise>>(),
		staleTime: 30_000,
	})

export const readingDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["admin", "practice", "reading", "detail", id],
		queryFn: () => api.get(`admin/practice/reading/exercises/${id}`).json<ApiResponse<AdminReadingDetail>>(),
	})

function invalidateList(qc: ReturnType<typeof useQueryClient>): void {
	qc.invalidateQueries({ queryKey: ["admin", "practice", "reading", "list"] })
}

function invalidateDetail(qc: ReturnType<typeof useQueryClient>, id: string): void {
	qc.invalidateQueries({ queryKey: ["admin", "practice", "reading", "detail", id] })
}

export function useCreateReading() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: ReadingFormInput) =>
			api.post("admin/practice/reading/exercises", { json: input }).json<ApiResponse<AdminReadingExercise>>(),
		onSuccess: () => invalidateList(qc),
	})
}

export function useUpdateReading(id: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: Partial<ReadingFormInput>) =>
			api
				.patch(`admin/practice/reading/exercises/${id}`, { json: input })
				.json<ApiResponse<AdminReadingExercise>>(),
		onSuccess: () => {
			invalidateList(qc)
			invalidateDetail(qc, id)
		},
	})
}

export function useDeleteReading() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/practice/reading/exercises/${id}`),
		onSuccess: () => invalidateList(qc),
	})
}

export function useSetReadingPublished() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, published }: { id: string; published: boolean }) =>
			api
				.post(`admin/practice/reading/exercises/${id}/${published ? "publish" : "unpublish"}`)
				.json<ApiResponse<AdminReadingExercise>>(),
		onSuccess: (_d, { id }) => {
			invalidateList(qc)
			invalidateDetail(qc, id)
		},
	})
}

export function useCreateReadingQuestion(exerciseId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: McqQuestionFormInput) =>
			api
				.post(`admin/practice/reading/exercises/${exerciseId}/questions`, { json: input })
				.json<ApiResponse<McqQuestion>>(),
		onSuccess: () => invalidateDetail(qc, exerciseId),
	})
}

export function useUpdateReadingQuestion(exerciseId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: Partial<McqQuestionFormInput> }) =>
			api.patch(`admin/practice/reading/questions/${id}`, { json: input }).json<ApiResponse<McqQuestion>>(),
		onSuccess: () => invalidateDetail(qc, exerciseId),
	})
}

export function useDeleteReadingQuestion(exerciseId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/practice/reading/questions/${id}`),
		onSuccess: () => invalidateDetail(qc, exerciseId),
	})
}
