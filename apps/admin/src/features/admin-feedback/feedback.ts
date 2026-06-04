import { queryOptions } from "@tanstack/react-query"
import { api, type PaginatedResponse } from "#/lib/api"

export type ExerciseFeedbackContentType = "practice_listening_exercise" | "practice_reading_exercise"

export interface ExerciseFeedbackProfile {
	id: string
	nickname: string
}

export interface ExerciseFeedbackItem {
	id: string
	content_type: ExerciseFeedbackContentType
	content_id: string
	content_title: string | null
	content_slug: string | null
	rating: number
	comment: string | null
	profile: ExerciseFeedbackProfile | null
	created_at: string
}

export interface FeedbackFilters {
	page?: number
	per_page?: number
	content_type?: ExerciseFeedbackContentType | "all"
	rating?: number
}

function buildFeedbackSearch(filters: FeedbackFilters): string {
	const params = new URLSearchParams()
	if (filters.page) params.set("page", String(filters.page))
	if (filters.per_page) params.set("per_page", String(filters.per_page))
	if (filters.content_type && filters.content_type !== "all") params.set("content_type", filters.content_type)
	if (filters.rating) params.set("rating", String(filters.rating))

	const query = params.toString()
	return query ? `?${query}` : ""
}

export const feedbackListQuery = (filters: FeedbackFilters) =>
	queryOptions({
		queryKey: ["admin", "feedback", "list", filters],
		queryFn: () =>
			api
				.get(`admin/feedback${buildFeedbackSearch(filters)}`)
				.json<PaginatedResponse<ExerciseFeedbackItem>>(),
		staleTime: 30_000,
	})
