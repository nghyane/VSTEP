import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { appConfigQuery } from "#/features/exam/queries"
import { assessmentViewQuery } from "#/features/grading/queries"
import type { AssessmentView, GradingProgress, WritingGradingResult } from "#/features/grading/types"
import { type ApiResponse, api } from "#/lib/api"

interface Input {
	attemptId: string
}

interface RequestFeedbackResponse {
	submission_id: string
	status: string
	cost_coins: number
	charged: boolean
}

export function useWritingAssessment({ attemptId }: Input) {
	const queryClient = useQueryClient()
	const { data: configData } = useSuspenseQuery(appConfigQuery)
	const view = useQuery({
		...assessmentViewQuery(attemptId),
		refetchInterval: (query) => {
			const status = query.state.data?.data.status
			return status === "ready" || status === "failed" ? false : 1500
		},
		retry: false,
	})
	const feedback = useMutation({
		mutationFn: () => requestFeedback(attemptId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["assessment-attempts", attemptId, "view"] })
			queryClient.invalidateQueries({ queryKey: ["wallet"] })
		},
	})
	const viewData = view.data?.data ?? null
	const viewResult = writingResult(viewData)

	return {
		status: status(viewData?.status, viewResult, view.isError),
		result: viewResult,
		rubric: viewData?.rubric ?? null,
		context: viewData?.context ?? null,
		progress: normalizeProgress(viewData?.progress),
		error: viewData?.error ?? errorMessage(view.error),
		feedbackCost:
			viewData?.feedback_request.cost_coins ?? configData.data.pricing.practice.feedback_cost_coins,
		feedbackCanRequest: viewData?.feedback_request.can_request === true,
		feedbackRequested: feedback.isSuccess || viewData?.feedback_request.requested === true,
		feedbackPending: feedback.isPending,
		feedbackError: errorMessage(feedback.error),
		requestFeedback: () => feedback.mutate(),
	}
}

function status(jobStatus: string | undefined, result: unknown, failed: boolean) {
	if (failed || jobStatus === "failed") return "failed"
	if (result) return "ready"
	return "pending"
}

function normalizeProgress(progress: GradingProgress[] | GradingProgress | undefined): GradingProgress[] {
	if (!progress) return []
	return Array.isArray(progress) ? progress : [progress]
}

function errorMessage(error: unknown): string | null {
	return error instanceof Error ? error.message : null
}

function writingResult(view: AssessmentView | null): WritingGradingResult | null {
	if (!view || view.context.skill !== "writing" || !view.result) return null
	return {
		overall_band: view.result.overall_band,
		criterion_scores: view.result.criterion_scores,
		feedback: view.result.feedback,
	}
}

async function requestFeedback(attemptId: string) {
	return api.post(`assessment-attempts/${attemptId}/feedback`).json<ApiResponse<RequestFeedbackResponse>>()
}
