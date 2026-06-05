import { queryOptions } from "@tanstack/react-query"
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

export const listeningExercisesQuery = queryOptions({
	queryKey: ["practice", "listening", "exercises"],
	queryFn: () => api.get("practice/listening/exercises").json<ApiResponse<ListeningExerciseSummary[]>>(),
})

export const listeningExerciseDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["practice", "listening", "exercises", id],
		queryFn: () => api.get(`practice/listening/exercises/${id}`).json<ApiResponse<ExerciseDetail>>(),
	})

export const readingExercisesQuery = queryOptions({
	queryKey: ["practice", "reading", "exercises"],
	queryFn: () => api.get("practice/reading/exercises").json<ApiResponse<ReadingExercise[]>>(),
})

export const readingExerciseDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["practice", "reading", "exercises", id],
		queryFn: () => api.get(`practice/reading/exercises/${id}`).json<ApiResponse<ReadingExerciseDetail>>(),
	})

export const writingPromptsQuery = queryOptions({
	queryKey: ["practice", "writing", "prompts"],
	queryFn: () => api.get("practice/writing/prompts").json<ApiResponse<WritingPrompt[]>>(),
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

export const writingHistoryQuery = queryOptions({
	queryKey: ["practice", "writing", "history"],
	queryFn: () => api.get("practice/writing/history").json<PaginatedResponse<WritingHistoryItem>>(),
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
