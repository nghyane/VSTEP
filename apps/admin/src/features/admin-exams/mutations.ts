import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query"
import type { AdminExam, ExamFormInput } from "#/features/admin-exams/types"
import { type ApiResponse, api } from "#/lib/api"

function invalidateExams(qc: QueryClient): void {
	qc.invalidateQueries({ queryKey: ["admin", "exams"] })
}

export function useCreateExam() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: ExamFormInput) =>
			api.post("admin/exams", { json: input }).json<ApiResponse<AdminExam>>(),
		onSuccess: () => invalidateExams(qc),
	})
}

export function useUpdateExam(examId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: Partial<ExamFormInput>) =>
			api.patch(`admin/exams/${examId}`, { json: input }).json<ApiResponse<AdminExam>>(),
		onSuccess: () => invalidateExams(qc),
	})
}

export function useDeleteExam() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/exams/${id}`),
		onSuccess: () => invalidateExams(qc),
	})
}

export function useSetExamPublished() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, published }: { id: string; published: boolean }) =>
			api.post(`admin/exams/${id}/${published ? "publish" : "unpublish"}`).json<ApiResponse<AdminExam>>(),
		onSuccess: () => invalidateExams(qc),
	})
}

export function useImportExam() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (payload: unknown) =>
			api.post("admin/exams/import", { json: payload }).json<ApiResponse<AdminExam>>(),
		onSuccess: () => invalidateExams(qc),
	})
}
