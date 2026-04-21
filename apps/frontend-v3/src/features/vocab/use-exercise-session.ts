import { useCallback, useState } from "react"
import { attemptExercise } from "#/features/vocab/actions"
import type { VocabExercise } from "#/features/vocab/types"

export type ExerciseKind = "mcq" | "fill_blank" | "word_form"

interface ExerciseResult {
	correct: boolean
	explanation: string | null
}

interface ExerciseSession {
	current: VocabExercise | undefined
	payload: Record<string, unknown> | undefined
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

	const current = exercises[index]
	const total = exercises.length
	const done = index >= total
	const payload = current?.payload

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

	return { current, payload, total, index, done, selected, textAnswer, result, submitting, select: setSelected, setTextAnswer, submit, next }
}

export type { ExerciseResult }
