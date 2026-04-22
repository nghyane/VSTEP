import { queryOptions } from "@tanstack/react-query"
import type {
	ExerciseDetail,
	ListeningExerciseSummary,
	ReadingExercise,
	ReadingExerciseDetail,
	SpeakingDrill,
	SpeakingDrillDetail,
	SpeakingTask,
	SpeakingTaskDetail,
	WritingPrompt,
	WritingPromptDetail,
} from "#/features/practice/types"
import { type ApiResponse, api } from "#/lib/api"

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

export const speakingDrillsQuery = queryOptions({
	queryKey: ["practice", "speaking", "drills"],
	queryFn: () => api.get("practice/speaking/drills").json<ApiResponse<SpeakingDrill[]>>(),
})

export const speakingDrillDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["practice", "speaking", "drills", id],
		queryFn: () => api.get(`practice/speaking/drills/${id}`).json<ApiResponse<SpeakingDrillDetail>>(),
	})

export const speakingTasksQuery = queryOptions({
	queryKey: ["practice", "speaking", "tasks"],
	queryFn: () => api.get("practice/speaking/tasks").json<ApiResponse<SpeakingTask[]>>(),
})

export const speakingTaskDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ["practice", "speaking", "tasks", id],
		queryFn: () => api.get(`practice/speaking/tasks/${id}`).json<ApiResponse<SpeakingTaskDetail>>(),
	})

export const mcqProgressQuery = (skill: "listening" | "reading") =>
	queryOptions({
		queryKey: ["practice", skill, "progress"],
		queryFn: () =>
			api
				.get(`practice/${skill}/progress`)
				.json<ApiResponse<Record<string, { score: number; total: number }>>>(),
	})
