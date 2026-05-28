import { queryOptions } from "@tanstack/react-query"
import type { RubricMeta, SpeakingGradingResult, WritingGradingResult } from "#/features/grading/types"
import { type ApiResponse, api } from "#/lib/api"

/** Load writing result by submission — used for history/rubric display. */
export const writingResultQuery = (submissionType: string, submissionId: string) =>
	queryOptions({
		queryKey: ["grading", "writing", submissionType, submissionId],
		queryFn: () =>
			api
				.get(`grading/writing/${submissionType}/${submissionId}`)
				.json<ApiResponse<WritingGradingResult | null> & { rubric?: RubricMeta }>(),
	})

/** Load speaking result by submission — used for history/rubric display. */
export const speakingResultQuery = (submissionType: string, submissionId: string) =>
	queryOptions({
		queryKey: ["grading", "speaking", submissionType, submissionId],
		queryFn: () =>
			api
				.get(`grading/speaking/${submissionType}/${submissionId}`)
				.json<ApiResponse<SpeakingGradingResult | null> & { rubric?: RubricMeta }>(),
	})
