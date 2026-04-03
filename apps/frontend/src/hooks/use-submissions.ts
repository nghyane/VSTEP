import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { PaginatedResponse, SubmissionFull } from "@/types/api"

function useSubmissions(params?: { page?: number; skill?: string; status?: string }) {
	const searchParams = new URLSearchParams()
	if (params?.page) searchParams.set("page", String(params.page))
	if (params?.skill) searchParams.set("skill", params.skill)
	if (params?.status) searchParams.set("status", params.status)
	const qs = searchParams.toString()
	return useQuery({
		queryKey: ["submissions", params],
		queryFn: () =>
			api.get<PaginatedResponse<SubmissionFull>>(`/api/submissions${qs ? `?${qs}` : ""}`),
	})
}

const GRADING_POLL_MS = 5_000

function useSubmission(id: string) {
	return useQuery({
		queryKey: ["submissions", id],
		queryFn: () => api.get<SubmissionFull>(`/api/submissions/${id}`),
		enabled: !!id,
		refetchInterval: (query) => {
			const status = query.state.data?.status
			if (!status) return GRADING_POLL_MS
			return status === "pending" || status === "processing" || status === "review_pending"
				? GRADING_POLL_MS
				: false
		},
	})
}

export { useSubmission, useSubmissions }
