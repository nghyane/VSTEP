import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { ExplainResponse, ParaphraseResponse, Skill } from "@/types/api"

function useParaphrase() {
	return useMutation({
		mutationFn: (body: { text: string; skill: Skill; context?: string }) =>
			api.post<ParaphraseResponse>("/api/ai/paraphrase", body),
	})
}

function useExplain() {
	return useMutation({
		mutationFn: (body: {
			text: string
			skill: Skill
			questionNumbers?: number[]
			answers?: Record<string, string>
			correctAnswers?: Record<string, string>
		}) => api.post<ExplainResponse>("/api/ai/explain", body),
	})
}

export { useExplain, useParaphrase }
