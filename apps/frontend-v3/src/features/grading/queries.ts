import { queryOptions } from "@tanstack/react-query"
import type { GradingJob, SpeakingGradingResult, WritingGradingResult } from "#/features/grading/types"
import { type ApiResponse, api } from "#/lib/api"

export const gradingJobQuery = (jobId: string) =>
	queryOptions({
		queryKey: ["grading", "jobs", jobId],
		queryFn: () => api.get(`grading/jobs/${jobId}`).json<ApiResponse<GradingJob>>(),
	})

export const writingGradingQuery = (submissionType: string, submissionId: string) =>
	queryOptions({
		queryKey: ["grading", "writing", submissionType, submissionId],
		queryFn: () =>
			api
				.get(`grading/writing/${submissionType}/${submissionId}`)
				.json<ApiResponse<WritingGradingResult | null>>(),
	})

export const speakingGradingQuery = (submissionType: string, submissionId: string) =>
	queryOptions({
		queryKey: ["grading", "speaking", submissionType, submissionId],
		queryFn: () =>
			api
				.get(`grading/speaking/${submissionType}/${submissionId}`)
				.json<ApiResponse<SpeakingGradingResult | null>>(),
	})
