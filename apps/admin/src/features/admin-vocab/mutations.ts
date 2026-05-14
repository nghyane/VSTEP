import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
	AdminVocabExercise,
	AdminVocabTopic,
	AdminVocabWord,
	ExerciseFormInput,
	TopicFormInput,
	WordFormInput,
} from "#/features/admin-vocab/types"
import { type ApiResponse, api } from "#/lib/api"

function invalidateTopics(qc: QueryClient): void {
	qc.invalidateQueries({ queryKey: ["admin", "vocab", "topics"] })
}

function invalidateTopicDetail(qc: QueryClient, topicId: string): void {
	qc.invalidateQueries({ queryKey: ["admin", "vocab", "topics", "detail", topicId] })
	qc.invalidateQueries({ queryKey: ["admin", "vocab", "topics", topicId] })
}

export function useCreateTopic() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: TopicFormInput) =>
			api.post("admin/vocab/topics", { json: input }).json<ApiResponse<AdminVocabTopic>>(),
		onSuccess: () => invalidateTopics(qc),
	})
}

export function useUpdateTopic(topicId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: Partial<TopicFormInput>) =>
			api.patch(`admin/vocab/topics/${topicId}`, { json: input }).json<ApiResponse<AdminVocabTopic>>(),
		onSuccess: () => {
			invalidateTopics(qc)
			invalidateTopicDetail(qc, topicId)
		},
	})
}

export function useDeleteTopic() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/vocab/topics/${id}`),
		onSuccess: () => invalidateTopics(qc),
	})
}

export function useSetTopicPublished() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, published }: { id: string; published: boolean }) =>
			api
				.post(`admin/vocab/topics/${id}/${published ? "publish" : "unpublish"}`)
				.json<ApiResponse<AdminVocabTopic>>(),
		onSuccess: (_data, { id }) => {
			invalidateTopics(qc)
			invalidateTopicDetail(qc, id)
		},
	})
}

export function useCreateWord(topicId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: WordFormInput) =>
			api.post(`admin/vocab/topics/${topicId}/words`, { json: input }).json<ApiResponse<AdminVocabWord>>(),
		onSuccess: () => invalidateTopicDetail(qc, topicId),
	})
}

export function useUpdateWord(topicId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: Partial<WordFormInput> }) =>
			api.patch(`admin/vocab/words/${id}`, { json: input }).json<ApiResponse<AdminVocabWord>>(),
		onSuccess: () => invalidateTopicDetail(qc, topicId),
	})
}

export function useDeleteWord(topicId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/vocab/words/${id}`),
		onSuccess: () => invalidateTopicDetail(qc, topicId),
	})
}

export function useCreateExercise(topicId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: ExerciseFormInput) =>
			api
				.post(`admin/vocab/topics/${topicId}/exercises`, { json: input })
				.json<ApiResponse<AdminVocabExercise>>(),
		onSuccess: () => invalidateTopicDetail(qc, topicId),
	})
}

export function useUpdateExercise(topicId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({
			id,
			input,
		}: {
			id: string
			input: Partial<Pick<ExerciseFormInput, "explanation" | "display_order" | "payload">>
		}) => api.patch(`admin/vocab/exercises/${id}`, { json: input }).json<ApiResponse<AdminVocabExercise>>(),
		onSuccess: () => invalidateTopicDetail(qc, topicId),
	})
}

export function useDeleteExercise(topicId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/vocab/exercises/${id}`),
		onSuccess: () => invalidateTopicDetail(qc, topicId),
	})
}
