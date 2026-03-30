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

/**
 * Normalize answer data to 1-indexed Record<string, string>.
 * API may return array (0-indexed) or object (1-indexed).
 */
function normalizeAnswers(data: Record<string, string> | string[]): Record<string, string> {
	if (Array.isArray(data)) {
		const out: Record<string, string> = {}
		for (let i = 0; i < data.length; i++) {
			out[String(i + 1)] = data[i]
		}
		return out
	}
	return data
}

function getObjectiveAnswer(
	answers: Map<string, SubmissionAnswer>,
	questionId: string,
): Record<string, string> {
	const entry = answers.get(questionId)
	if (entry && "answers" in entry) return normalizeAnswers(entry.answers)
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

	const flushDirty = useCallback((): Promise<void> => {
		const dirty = dirtyRef.current
		if (dirty.size === 0) return Promise.resolve()
		const current = answersRef.current
		const payload: { questionId: string; answer: SubmissionAnswer }[] = []
		for (const qId of dirty) {
			const answer = current.get(qId)
			if (answer) payload.push({ questionId: qId, answer })
		}
		dirty.clear()
		if (payload.length > 0) {
			return saveMutation.mutateAsync(payload).then(() => {})
		}
		return Promise.resolve()
	}, [saveMutation])

	const flush = useCallback((): Promise<void> => {
		if (timerRef.current) {
			clearTimeout(timerRef.current)
			timerRef.current = null
		}
		return flushDirty()
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
