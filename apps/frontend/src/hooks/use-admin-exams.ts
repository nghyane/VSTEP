import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Exam, ExamBlueprint, QuestionLevel } from "@/types/api"

function useCreateExam() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (body: { level: QuestionLevel; blueprint: ExamBlueprint; isActive?: boolean }) =>
			api.post<Exam>("/api/exams", body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["exams"] })
		},
	})
}

function useAdminUpdateExam() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({
			id,
			...body
		}: {
			id: string
			level?: QuestionLevel
			blueprint?: ExamBlueprint
			isActive?: boolean
		}) => api.patch<Exam>(`/api/exams/${id}`, body),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["exams"] })
		},
	})
}

export { useAdminUpdateExam, useCreateExam }
