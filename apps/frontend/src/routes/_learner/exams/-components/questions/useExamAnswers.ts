import { useCallback, useEffect, useRef, useState } from "react"
import { useSaveAnswers } from "@/hooks/use-exam-session"
import type { SessionAnswer, SubmissionAnswer } from "@/types/api"

const DEBOUNCE_MS = 2500
const OPTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

function buildInitialMap(initial: SessionAnswer[]): Map<string, SubmissionAnswer> {
	const map = new Map<string, SubmissionAnswer>()
	for (const a of initial) {
		map.set(a.questionId, a.answer)
	}
	return map
}

function getObjectiveAnswer(
	answers: Map<string, SubmissionAnswer>,
	questionId: string,
): Record<string, string> {
	const entry = answers.get(questionId)
	if (entry && "answers" in entry) return entry.answers
	return {}
}

function setMCQAnswer(
	updateAnswer: (qId: string, answer: SubmissionAnswer) => void,
	questionId: string,
	currentAnswers: Record<string, string>,
	itemIndex: number,
	optionIndex: number,
): void {
	const key = String(itemIndex + 1)
	const value = OPTION_LETTERS[optionIndex]
	updateAnswer(questionId, {
		answers: { ...currentAnswers, [key]: value },
	})
}

function useExamAnswers(sessionId: string, initialAnswers: SessionAnswer[]) {
	const [answers, setAnswers] = useState<Map<string, SubmissionAnswer>>(() =>
		buildInitialMap(initialAnswers),
	)
	const dirtyRef = useRef<Set<string>>(new Set())
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const saveMutation = useSaveAnswers(sessionId)
	const answersRef = useRef(answers)
	answersRef.current = answers

	const flushDirty = useCallback(() => {
		const dirty = dirtyRef.current
		if (dirty.size === 0) return
		const current = answersRef.current
		const payload: { questionId: string; answer: SubmissionAnswer }[] = []
		for (const qId of dirty) {
			const answer = current.get(qId)
			if (answer) payload.push({ questionId: qId, answer })
		}
		dirty.clear()
		if (payload.length > 0) {
			saveMutation.mutate(payload)
		}
	}, [saveMutation])

	const flush = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current)
			timerRef.current = null
		}
		flushDirty()
	}, [flushDirty])

	const updateAnswer = useCallback(
		(questionId: string, answer: SubmissionAnswer) => {
			setAnswers((prev) => {
				const next = new Map(prev)
				next.set(questionId, answer)
				return next
			})
			dirtyRef.current.add(questionId)

			if (timerRef.current) clearTimeout(timerRef.current)
			timerRef.current = setTimeout(flushDirty, DEBOUNCE_MS)
		},
		[flushDirty],
	)

	useEffect(() => {
		const handler = () => {
			flushDirty()
		}
		window.addEventListener("beforeunload", handler)
		return () => {
			window.removeEventListener("beforeunload", handler)
			if (timerRef.current) clearTimeout(timerRef.current)
			flushDirty()
		}
	}, [flushDirty])

	return {
		answers,
		updateAnswer,
		flush,
		isSaving: saveMutation.isPending,
	}
}

export { getObjectiveAnswer, OPTION_LETTERS, setMCQAnswer, useExamAnswers }
