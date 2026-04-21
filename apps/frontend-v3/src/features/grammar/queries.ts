import { queryOptions } from "@tanstack/react-query"
import { type ApiResponse, api } from "#/lib/api"
import type { GrammarPoint, GrammarPointDetail } from "#/features/grammar/types"

export const grammarPointsQuery = queryOptions({
	queryKey: ["grammar", "points"],
	queryFn: () => api.get("grammar/points").json<ApiResponse<GrammarPoint[]>>(),
})

export const grammarPointDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["grammar", "points", id],
		queryFn: () => api.get(`grammar/points/${id}`).json<ApiResponse<GrammarPointDetail>>(),
	})
