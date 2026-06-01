import { queryOptions } from "@tanstack/react-query"
import type { AssessmentView, RubricMeta, SpeakingGradingResult } from "#/features/grading/types"
import { type ApiResponse, api } from "#/lib/api"

export const assessmentViewQuery = (attemptId: string) =>
	queryOptions({
		queryKey: ["assessment-attempts", attemptId, "view"],
		queryFn: () => api.get(`assessment-attempts/${attemptId}/view`).json<ApiResponse<AssessmentView>>(),
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
