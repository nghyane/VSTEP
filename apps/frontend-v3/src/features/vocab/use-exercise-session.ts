import { useMutation } from "@tanstack/react-query"
import { useReducer } from "react"
import { attemptExercise } from "#/features/vocab/actions"
import type { ExerciseKind, VocabExercise } from "#/features/vocab/types"

export interface ExerciseResult {
	correct: boolean
	explanation: string | null
}

interface State {
	index: number
	selected: number | null
	textAnswer: string
	result: ExerciseResult | null
}

type Action =
	| { type: "select"; index: number }
	| { type: "text"; value: string }
	| { type: "answered"; result: ExerciseResult }
	| { type: "next" }

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "select":
			return { ...state, selected: action.index }
		case "text":
			return { ...state, textAnswer: action.value }
		case "answered":
			return { ...state, result: action.result }
		case "next":
			return { index: state.index + 1, selected: null, textAnswer: "", result: null }
	}
}

interface ExerciseSession {
	current: VocabExercise | null
	total: number
	index: number
	done: boolean
	selected: number | null
	textAnswer: string
	result: ExerciseResult | null
	submitting: boolean
	select: (i: number) => void
	setTextAnswer: (v: string) => void
	submit: () => void
	next: () => void
}

export function useExerciseSession(exercises: VocabExercise[], kind: ExerciseKind): ExerciseSession {
	const [state, dispatch] = useReducer(reducer, { index: 0, selected: null, textAnswer: "", result: null })

	const mutation = useMutation({
		mutationFn: ({ id, answer }: { id: string; answer: Record<string, unknown> }) => attemptExercise(id, answer),
		onSuccess: (res) => {
			dispatch({ type: "answered", result: { correct: res.data.is_correct, explanation: res.data.explanation } })
		},
	})

	const current = exercises[state.index] ?? null
	const total = exercises.length
	const done = state.index >= total

	function submit() {
		if (!current || mutation.isPending) return
		const answer = kind === "mcq" ? { selected_index: state.selected } : { text: state.textAnswer }
		mutation.mutate({ id: current.id, answer })
	}

	return {
		current,
		total,
		index: state.index,
		done,
		selected: state.selected,
		textAnswer: state.textAnswer,
		result: state.result,
		submitting: mutation.isPending,
		select: (i) => dispatch({ type: "select", index: i }),
		setTextAnswer: (v) => dispatch({ type: "text", value: v }),
		submit,
		next: () => dispatch({ type: "next" }),
	}
}
