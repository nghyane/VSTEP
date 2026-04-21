import { useCallback, useState } from "react"
import { attemptExercise } from "#/features/vocab/actions"
import type { ExerciseKind, VocabExercise } from "#/features/vocab/types"

export interface ExerciseResult {
	correct: boolean
	explanation: string | null
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
	const [index, setIndex] = useState(0)
	const [selected, setSelected] = useState<number | null>(null)
	const [textAnswer, setTextAnswer] = useState("")
	const [result, setResult] = useState<ExerciseResult | null>(null)
	const [submitting, setSubmitting] = useState(false)

	const current = exercises[index] ?? null
	const total = exercises.length
	const done = index >= total

	const submit = useCallback(async () => {
		if (!current || submitting) return
		setSubmitting(true)
		const answer = kind === "mcq" ? { selected_index: selected } : { text: textAnswer }
		const res = await attemptExercise(current.id, answer)
		setResult({ correct: res.data.is_correct, explanation: res.data.explanation })
		setSubmitting(false)
	}, [current, submitting, kind, selected, textAnswer])

	const next = useCallback(() => {
		setResult(null)
		setSelected(null)
		setTextAnswer("")
		setIndex((i) => i + 1)
	}, [])

	return { current, total, index, done, selected, textAnswer, result, submitting, select: setSelected, setTextAnswer, submit, next }
}
