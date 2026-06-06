import { keepPreviousData, queryOptions } from "@tanstack/react-query"
import type {
	ConversationHistoryItem,
	ConversationScenario,
	ConversationSessionDetail,
	ExerciseDetail,
	LearningPathData,
	ListeningExerciseSummary,
	ReadingExercise,
	ReadingExerciseDetail,
	ShadowingLesson,
	ShadowingLessonDetail,
	WritingHistoryItem,
	WritingPrompt,
	WritingPromptDetail,
} from "#/features/practice/types"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"

interface PracticeListParams {
	part?: number
	page: number
	perPage: number
}

function searchParams(params: Record<string, string | number | null | undefined>) {
	const sp = new URLSearchParams()
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== null && value !== "") sp.set(key, String(value))
	}
	return sp
}

export const listeningExercisesQuery = ({ part, page, perPage }: PracticeListParams) =>
	queryOptions({
		queryKey: ["practice", "listening", "exercises", part ?? "all", page, perPage],
		queryFn: () =>
			api
				.get("practice/listening/exercises", {
					searchParams: searchParams({ part, page, per_page: perPage }),
				})
				.json<PaginatedResponse<ListeningExerciseSummary>>(),
		placeholderData: keepPreviousData,
	})

export const listeningExerciseDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["practice", "listening", "exercises", id],
		queryFn: () => api.get(`practice/listening/exercises/${id}`).json<ApiResponse<ExerciseDetail>>(),
	})

export const readingExercisesQuery = ({ part, page, perPage }: PracticeListParams) =>
	queryOptions({
		queryKey: ["practice", "reading", "exercises", part ?? "all", page, perPage],
		queryFn: () =>
			api
				.get("practice/reading/exercises", {
					searchParams: searchParams({ part, page, per_page: perPage }),
				})
				.json<PaginatedResponse<ReadingExercise>>(),
		placeholderData: keepPreviousData,
	})

export const readingExerciseDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["practice", "reading", "exercises", id],
		queryFn: () => api.get(`practice/reading/exercises/${id}`).json<ApiResponse<ReadingExerciseDetail>>(),
	})

export const writingPromptsQuery = ({ part, page, perPage }: PracticeListParams) =>
	queryOptions({
		queryKey: ["practice", "writing", "prompts", part ?? "all", page, perPage],
		queryFn: () =>
			api
				.get("practice/writing/prompts", {
					searchParams: searchParams({ part, page, per_page: perPage }),
				})
				.json<PaginatedResponse<WritingPrompt>>(),
		placeholderData: keepPreviousData,
	})

export const writingPromptDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["practice", "writing", "prompts", id],
		queryFn: () => api.get(`practice/writing/prompts/${id}`).json<ApiResponse<WritingPromptDetail>>(),
	})

export const mcqProgressQuery = (skill: "listening" | "reading") =>
	queryOptions({
		queryKey: ["practice", skill, "progress"],
		queryFn: () =>
			api
				.get(`practice/${skill}/progress`)
				.json<ApiResponse<Record<string, { score: number; total: number }>>>(),
	})

export const writingHistoryQuery = (page: number, perPage: number) =>
	queryOptions({
		queryKey: ["practice", "writing", "history", page, perPage],
		queryFn: () =>
			api
				.get("practice/writing/history", { searchParams: searchParams({ page, per_page: perPage }) })
				.json<PaginatedResponse<WritingHistoryItem>>(),
		placeholderData: keepPreviousData,
	})

export const conversationScenariosQuery = queryOptions({
	queryKey: ["practice", "speaking", "scenarios"],
	queryFn: () => api.get("practice/speaking/scenarios").json<ApiResponse<ConversationScenario[]>>(),
})

export const conversationSessionQuery = (sessionId: string) =>
	queryOptions({
		queryKey: ["practice", "speaking", "conversations", sessionId],
		queryFn: () =>
			api.get(`practice/speaking/conversations/${sessionId}`).json<ApiResponse<ConversationSessionDetail>>(),
	})

export const conversationHistoryQuery = queryOptions({
	queryKey: ["practice", "speaking", "conversations", "history"],
	queryFn: () =>
		api
			.get("practice/speaking/conversations/history")
			.json<{ data: ConversationHistoryItem[]; meta: { total: number } }>(),
})

export const shadowingLessonsQuery = queryOptions({
	queryKey: ["practice", "speaking", "shadowing", "lessons"],
	queryFn: () => api.get("practice/speaking/drills").json<ApiResponse<ShadowingLesson[]>>(),
})

export const shadowingLessonDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["practice", "speaking", "shadowing", "lessons", id],
		queryFn: () => api.get(`practice/speaking/drills/${id}`).json<ApiResponse<ShadowingLessonDetail>>(),
	})

export const learningPathQuery = queryOptions({
	queryKey: ["learning-path"],
	queryFn: () => api.get("learning-path").json<ApiResponse<LearningPathData>>(),
	refetchOnMount: "always",
})
