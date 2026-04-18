// queryOptions factory cho grammar.
// Khi có API thật: thay queryFn → apiFetchGrammarPoints/Point, xóa mock imports.

import { queryOptions } from "@tanstack/react-query"
import { mockFetchGrammarPoint, mockFetchGrammarPoints } from "#/lib/mock/grammar"

export const grammarKeys = {
	all: ["grammar"] as const,
	points: () => [...grammarKeys.all, "points"] as const,
	point: (pointId: string) => [...grammarKeys.all, "point", pointId] as const,
}

export const grammarPointsQueryOptions = () =>
	queryOptions({
		queryKey: grammarKeys.points(),
		queryFn: mockFetchGrammarPoints,
		staleTime: 1000 * 60 * 5,
	})

export const grammarPointQueryOptions = (pointId: string) =>
	queryOptions({
		queryKey: grammarKeys.point(pointId),
		queryFn: () => mockFetchGrammarPoint(pointId),
		staleTime: 1000 * 60 * 5,
	})
