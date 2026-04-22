import { queryOptions } from "@tanstack/react-query"
import type { Exam, ExamCostMeta, ExamDetail } from "#/features/exam/types"
import { type ApiResponse, api } from "#/lib/api"

export const examsQuery = queryOptions({
	queryKey: ["exams"],
	queryFn: () => api.get("exams").json<ApiResponse<Exam[]>>(),
})

export const examCostsQuery = queryOptions({
	queryKey: ["config", "exam-costs"],
	queryFn: () => api.get("config/exam-costs").json<ApiResponse<ExamCostMeta>>(),
	staleTime: 5 * 60 * 1000, // config thay đổi ít — cache 5 phút
})

export const examDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["exams", id],
		queryFn: () => api.get(`exams/${id}`).json<ApiResponse<ExamDetail>>(),
	})
