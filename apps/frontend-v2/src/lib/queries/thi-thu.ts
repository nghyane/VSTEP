import { queryOptions } from "@tanstack/react-query"
import { mockFetchExamDetail } from "#/lib/mock/thi-thu"

export const examDetailQueryOptions = (id: number) =>
	queryOptions({
		queryKey: ["exam-detail", id],
		queryFn: () => mockFetchExamDetail(id),
		staleTime: 1000 * 60 * 5,
	})
