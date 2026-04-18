import { queryOptions } from "@tanstack/react-query"
import { mockFetchExamDetail } from "#/mocks/thi-thu"

export const examDetailQueryOptions = (id: number) =>
	queryOptions({
		queryKey: ["exam-detail", id],
		queryFn: () => mockFetchExamDetail(id),
		staleTime: 1000 * 60 * 5,
	})
