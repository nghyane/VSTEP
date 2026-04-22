import { queryOptions } from "@tanstack/react-query"
import type { Exam, ExamDetail } from "#/features/exam/types"
import { type ApiResponse, api } from "#/lib/api"

export const examsQuery = queryOptions({
	queryKey: ["exams"],
	queryFn: () => api.get("exams").json<ApiResponse<Exam[]>>(),
})

export const examDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["exams", id],
		queryFn: () => api.get(`exams/${id}`).json<ApiResponse<ExamDetail>>(),
	})
