import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useReducer, useRef } from "react"
import type { SubmitResult } from "#/features/practice/types"

interface State {
	answers: Record<string, number>
	result: SubmitResult | null
}

type Action =
	| { type: "select"; questionId: string; index: number }
	| { type: "submitted"; result: SubmitResult }

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "select":
			return { ...state, answers: { ...state.answers, [action.questionId]: action.index } }
		case "submitted":
			return { ...state, result: action.result }
	}
}

export interface McqPracticeSession {
	answers: Record<string, number>
	result: SubmitResult | null
	submitting: boolean
	answeredCount: number
	select: (questionId: string, index: number) => void
	submit: () => void
}

export function useMcqPracticeSession(
	sessionId: string | null,
	submitFn: (
		sessionId: string,
		answers: { question_id: string; selected_index: number }[],
	) => Promise<{ data: SubmitResult }>,
	skill?: "listening" | "reading",
): McqPracticeSession {
	const [state, dispatch] = useReducer(reducer, { answers: {}, result: null })
	const answersRef = useRef(state.answers)
	answersRef.current = state.answers
	const qc = useQueryClient()

	const mutation = useMutation({
		mutationFn: () => {
			if (!sessionId) throw new Error("No session")
			const formatted = Object.entries(answersRef.current).map(([question_id, selected_index]) => ({
				question_id,
				selected_index,
			}))
			return submitFn(sessionId, formatted)
		},
		onSuccess: (res) => {
			dispatch({ type: "submitted", result: res.data })
			if (skill) qc.invalidateQueries({ queryKey: ["practice", skill, "progress"] })
		},
	})

	return {
		answers: state.answers,
		result: state.result,
		submitting: mutation.isPending,
		answeredCount: Object.keys(state.answers).length,
		select: (questionId, index) => dispatch({ type: "select", questionId, index }),
		submit: () => mutation.mutate(),
	}
}
