import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { SubmissionFull } from "@/types/api"

function useAutoGrade() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			api.post<{ score: number; result: Record<string, unknown> }>(
				`/api/submissions/${id}/auto-grade`,
			),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["submissions"] })
		},
	})
}

function useAssignReviewer() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, reviewerId }: { id: string; reviewerId: string }) =>
			api.post<SubmissionFull>(`/api/submissions/${id}/assign`, { reviewerId }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["submissions"] })
		},
	})
}

export { useAssignReviewer, useAutoGrade }
