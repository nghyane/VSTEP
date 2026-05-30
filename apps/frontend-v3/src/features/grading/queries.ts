import { queryOptions } from "@tanstack/react-query"
import type { RubricMeta, SpeakingGradingResult, WritingGradingResult } from "#/features/grading/types"
import { type ApiResponse, api } from "#/lib/api"

/** Load practice writing result by submission — used for history/rubric display. */
export const writingResultQuery = (submissionId: string) =>
	queryOptions({
		queryKey: ["practice", "writing", "result", submissionId],
		queryFn: () =>
			api
				.get(`practice/writing/submissions/${submissionId}/result`)
				.json<ApiResponse<WritingGradingResult | null> & { rubric?: RubricMeta }>(),
	})

/** Load practice speaking result by submission — used for history/rubric display. */
export const speakingResultQuery = (submissionId: string) =>
	queryOptions({
		queryKey: ["practice", "speaking", "result", submissionId],
		queryFn: () =>
			api
				.get(`practice/speaking/submissions/${submissionId}/result`)
				.json<ApiResponse<SpeakingGradingResult | null> & { rubric?: RubricMeta }>(),
	})
