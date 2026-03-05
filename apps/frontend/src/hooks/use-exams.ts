import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Exam, ExamType, PaginatedResponse } from "@/types/api"

interface UseExamsParams {
	type?: ExamType
	limit?: number
}

function useExams(params: UseExamsParams = {}) {
	const search = new URLSearchParams()
	if (params.type) search.set("type", params.type)
	if (params.limit) search.set("limit", String(params.limit))
	const qs = search.toString()

	return useQuery({
		queryKey: ["exams", params],
		queryFn: () => api.get<PaginatedResponse<Exam>>(`/api/exams${qs ? `?${qs}` : ""}`),
	})
}

export { useExams }
