import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
	AdminGrammarExample,
	AdminGrammarExercise,
	AdminGrammarMistake,
	AdminGrammarPoint,
	AdminGrammarStructure,
	AdminGrammarTip,
	ExampleFormInput,
	ExerciseFormInput,
	MistakeFormInput,
	PointFormInput,
	StructureFormInput,
	TipFormInput,
} from "#/features/admin-grammar/types"
import { type ApiResponse, api } from "#/lib/api"

function invalidatePoints(qc: QueryClient): void {
	qc.invalidateQueries({ queryKey: ["admin", "grammar", "points"] })
}

function invalidatePointDetail(qc: QueryClient, pointId: string): void {
	qc.invalidateQueries({ queryKey: ["admin", "grammar", "points", "detail", pointId] })
}

export function useCreatePoint() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: PointFormInput) =>
			api.post("admin/grammar/points", { json: input }).json<ApiResponse<AdminGrammarPoint>>(),
		onSuccess: () => invalidatePoints(qc),
	})
}

export function useUpdatePoint(pointId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: Partial<PointFormInput>) =>
			api.patch(`admin/grammar/points/${pointId}`, { json: input }).json<ApiResponse<AdminGrammarPoint>>(),
		onSuccess: () => {
			invalidatePoints(qc)
			invalidatePointDetail(qc, pointId)
		},
	})
}

export function useDeletePoint() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/grammar/points/${id}`),
		onSuccess: () => invalidatePoints(qc),
	})
}

export function useSetPointPublished() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, published }: { id: string; published: boolean }) =>
			api
				.post(`admin/grammar/points/${id}/${published ? "publish" : "unpublish"}`)
				.json<ApiResponse<AdminGrammarPoint>>(),
		onSuccess: (_data, { id }) => {
			invalidatePoints(qc)
			invalidatePointDetail(qc, id)
		},
	})
}

// ─── Structures ─────────────────────────────────────────────

export function useCreateStructure(pointId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: StructureFormInput) =>
			api
				.post(`admin/grammar/points/${pointId}/structures`, { json: input })
				.json<ApiResponse<AdminGrammarStructure>>(),
		onSuccess: () => invalidatePointDetail(qc, pointId),
	})
}

export function useUpdateStructure(pointId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: Partial<StructureFormInput> }) =>
			api.patch(`admin/grammar/structures/${id}`, { json: input }).json<ApiResponse<AdminGrammarStructure>>(),
		onSuccess: () => invalidatePointDetail(qc, pointId),
	})
}

export function useDeleteStructure(pointId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/grammar/structures/${id}`),
		onSuccess: () => invalidatePointDetail(qc, pointId),
	})
}

// ─── Examples ───────────────────────────────────────────────

export function useCreateExample(pointId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: ExampleFormInput) =>
			api
				.post(`admin/grammar/points/${pointId}/examples`, { json: input })
				.json<ApiResponse<AdminGrammarExample>>(),
		onSuccess: () => invalidatePointDetail(qc, pointId),
	})
}

export function useUpdateExample(pointId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: Partial<ExampleFormInput> }) =>
			api.patch(`admin/grammar/examples/${id}`, { json: input }).json<ApiResponse<AdminGrammarExample>>(),
		onSuccess: () => invalidatePointDetail(qc, pointId),
	})
}

export function useDeleteExample(pointId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/grammar/examples/${id}`),
		onSuccess: () => invalidatePointDetail(qc, pointId),
	})
}

// ─── Mistakes ───────────────────────────────────────────────

export function useCreateMistake(pointId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: MistakeFormInput) =>
			api
				.post(`admin/grammar/points/${pointId}/mistakes`, { json: input })
				.json<ApiResponse<AdminGrammarMistake>>(),
		onSuccess: () => invalidatePointDetail(qc, pointId),
	})
}

export function useUpdateMistake(pointId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: Partial<MistakeFormInput> }) =>
			api.patch(`admin/grammar/mistakes/${id}`, { json: input }).json<ApiResponse<AdminGrammarMistake>>(),
		onSuccess: () => invalidatePointDetail(qc, pointId),
	})
}

export function useDeleteMistake(pointId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/grammar/mistakes/${id}`),
		onSuccess: () => invalidatePointDetail(qc, pointId),
	})
}

// ─── Tips ───────────────────────────────────────────────────

export function useCreateTip(pointId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: TipFormInput) =>
			api.post(`admin/grammar/points/${pointId}/tips`, { json: input }).json<ApiResponse<AdminGrammarTip>>(),
		onSuccess: () => invalidatePointDetail(qc, pointId),
	})
}

export function useUpdateTip(pointId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: Partial<TipFormInput> }) =>
			api.patch(`admin/grammar/tips/${id}`, { json: input }).json<ApiResponse<AdminGrammarTip>>(),
		onSuccess: () => invalidatePointDetail(qc, pointId),
	})
}

export function useDeleteTip(pointId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/grammar/tips/${id}`),
		onSuccess: () => invalidatePointDetail(qc, pointId),
	})
}

// ─── Exercises ──────────────────────────────────────────────

export function useCreateExercise(pointId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: ExerciseFormInput) =>
			api
				.post(`admin/grammar/points/${pointId}/exercises`, { json: input })
				.json<ApiResponse<AdminGrammarExercise>>(),
		onSuccess: () => invalidatePointDetail(qc, pointId),
	})
}

export function useUpdateExercise(pointId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({
			id,
			input,
		}: {
			id: string
			input: Partial<Pick<ExerciseFormInput, "explanation" | "display_order" | "payload">>
		}) =>
			api.patch(`admin/grammar/exercises/${id}`, { json: input }).json<ApiResponse<AdminGrammarExercise>>(),
		onSuccess: () => invalidatePointDetail(qc, pointId),
	})
}

export function useDeleteExercise(pointId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/grammar/exercises/${id}`),
		onSuccess: () => invalidatePointDetail(qc, pointId),
	})
}
