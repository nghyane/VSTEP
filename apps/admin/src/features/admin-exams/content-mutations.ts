import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
	ListeningSection,
	ReadingPassage,
	SpeakingPart,
	WritingTask,
} from "#/features/admin-exams/types"
import { type ApiResponse, api } from "#/lib/api"

function invalidateVersion(qc: QueryClient, examId: string, versionId: string): void {
	qc.invalidateQueries({ queryKey: ["admin", "exams", examId, "versions", versionId] })
}

// ─── Listening Sections ───

interface SectionInput {
	part: number
	part_title: string
	duration_minutes: number
	audio_url?: string | null
	transcript?: string | null
}

export function useCreateListeningSection(examId: string, versionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: SectionInput) =>
			api
				.post(`admin/exams/versions/${versionId}/listening-sections`, { json: input })
				.json<ApiResponse<ListeningSection>>(),
		onSuccess: () => invalidateVersion(qc, examId, versionId),
	})
}

export function useUpdateListeningSection(examId: string, versionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, ...input }: Partial<SectionInput> & { id: string }) =>
			api
				.patch(`admin/exams/listening-sections/${id}`, { json: input })
				.json<ApiResponse<ListeningSection>>(),
		onSuccess: () => invalidateVersion(qc, examId, versionId),
	})
}

export function useDeleteListeningSection(examId: string, versionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/exams/listening-sections/${id}`),
		onSuccess: () => invalidateVersion(qc, examId, versionId),
	})
}

// ─── MCQ Items (Listening + Reading) ───

export interface McqItemInput {
	stem: string
	options: [string, string, string, string]
	correct_index: number
}

export function useCreateListeningItem(examId: string, versionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ sectionId, ...input }: McqItemInput & { sectionId: string }) =>
			api.post(`admin/exams/listening-sections/${sectionId}/items`, { json: input }).json(),
		onSuccess: () => invalidateVersion(qc, examId, versionId),
	})
}

export function useUpdateListeningItem(examId: string, versionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, ...input }: Partial<McqItemInput> & { id: string }) =>
			api.patch(`admin/exams/listening-items/${id}`, { json: input }).json(),
		onSuccess: () => invalidateVersion(qc, examId, versionId),
	})
}

export function useDeleteListeningItem(examId: string, versionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/exams/listening-items/${id}`),
		onSuccess: () => invalidateVersion(qc, examId, versionId),
	})
}

// ─── Reading Passages ───

interface PassageInput {
	part: number
	title: string
	duration_minutes: number
	passage: string
}

export function useCreateReadingPassage(examId: string, versionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: PassageInput) =>
			api
				.post(`admin/exams/versions/${versionId}/reading-passages`, { json: input })
				.json<ApiResponse<ReadingPassage>>(),
		onSuccess: () => invalidateVersion(qc, examId, versionId),
	})
}

export function useUpdateReadingPassage(examId: string, versionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, ...input }: Partial<PassageInput> & { id: string }) =>
			api.patch(`admin/exams/reading-passages/${id}`, { json: input }).json<ApiResponse<ReadingPassage>>(),
		onSuccess: () => invalidateVersion(qc, examId, versionId),
	})
}

export function useDeleteReadingPassage(examId: string, versionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/exams/reading-passages/${id}`),
		onSuccess: () => invalidateVersion(qc, examId, versionId),
	})
}

// ─── Reading Items ───

export function useCreateReadingItem(examId: string, versionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ passageId, ...input }: McqItemInput & { passageId: string }) =>
			api.post(`admin/exams/reading-passages/${passageId}/items`, { json: input }).json(),
		onSuccess: () => invalidateVersion(qc, examId, versionId),
	})
}

export function useUpdateReadingItem(examId: string, versionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, ...input }: Partial<McqItemInput> & { id: string }) =>
			api.patch(`admin/exams/reading-items/${id}`, { json: input }).json(),
		onSuccess: () => invalidateVersion(qc, examId, versionId),
	})
}

export function useDeleteReadingItem(examId: string, versionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/exams/reading-items/${id}`),
		onSuccess: () => invalidateVersion(qc, examId, versionId),
	})
}

// ─── Writing Tasks ───

export interface WritingTaskInput {
	part: number
	task_type: "letter" | "essay"
	duration_minutes: number
	prompt: string
	min_words: number
	instructions?: string[] | null
}

export function useCreateWritingTask(examId: string, versionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: WritingTaskInput) =>
			api
				.post(`admin/exams/versions/${versionId}/writing-tasks`, { json: input })
				.json<ApiResponse<WritingTask>>(),
		onSuccess: () => invalidateVersion(qc, examId, versionId),
	})
}

export function useUpdateWritingTask(examId: string, versionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, ...input }: Partial<WritingTaskInput> & { id: string }) =>
			api.patch(`admin/exams/writing-tasks/${id}`, { json: input }).json<ApiResponse<WritingTask>>(),
		onSuccess: () => invalidateVersion(qc, examId, versionId),
	})
}

export function useDeleteWritingTask(examId: string, versionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/exams/writing-tasks/${id}`),
		onSuccess: () => invalidateVersion(qc, examId, versionId),
	})
}

// ─── Speaking Parts ───

export interface SpeakingPartInput {
	part: number
	type: string
	duration_minutes: number
	speaking_seconds: number
	content: Record<string, unknown>
}

export function useCreateSpeakingPart(examId: string, versionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: SpeakingPartInput) =>
			api
				.post(`admin/exams/versions/${versionId}/speaking-parts`, { json: input })
				.json<ApiResponse<SpeakingPart>>(),
		onSuccess: () => invalidateVersion(qc, examId, versionId),
	})
}

export function useUpdateSpeakingPart(examId: string, versionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, ...input }: Partial<SpeakingPartInput> & { id: string }) =>
			api.patch(`admin/exams/speaking-parts/${id}`, { json: input }).json<ApiResponse<SpeakingPart>>(),
		onSuccess: () => invalidateVersion(qc, examId, versionId),
	})
}

export function useDeleteSpeakingPart(examId: string, versionId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.delete(`admin/exams/speaking-parts/${id}`),
		onSuccess: () => invalidateVersion(qc, examId, versionId),
	})
}
