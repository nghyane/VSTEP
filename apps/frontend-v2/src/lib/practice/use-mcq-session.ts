// Shared MCQ session state — dùng cho Listening và Reading (các skill có cùng pattern
// "show all questions, submit once, inline result colored").
// Không gắn với từng skill — caller truyền items + onComplete callback để lưu progress.

import { useCallback, useMemo, useState } from "react"
import { useSupportMode } from "./use-support-mode"

export type McqPhase = "answering" | "submitted"

/** Shape tối thiểu của 1 item MCQ mà hook cần. */
export interface McqSessionItem {
	readonly correctIndex: 0 | 1 | 2 | 3
}

export interface McqSessionResult {
	score: number
	total: number
}

export interface McqSession {
	phase: McqPhase
	supportMode: boolean
	selectedAnswers: Record<number, number>
	answeredCount: number
	canSubmit: boolean
	score: number
	total: number
	select: (itemIndex: number, optionIndex: number) => void
	submit: () => void
	reset: () => void
	isCorrect: (itemIndex: number) => boolean | null
}

interface Params {
	items: readonly McqSessionItem[]
	onComplete?: (result: McqSessionResult) => void
}

export function useMcqSession({ items, onComplete }: Params): McqSession {
	const supportMode = useSupportMode()
	const [phase, setPhase] = useState<McqPhase>("answering")
	const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})

	const total = items.length
	const answeredCount = Object.keys(selectedAnswers).length
	const canSubmit = phase === "answering" && answeredCount === total

	const score = useMemo(() => computeScore(items, selectedAnswers), [items, selectedAnswers])

	const select = useCallback(
		(itemIndex: number, optionIndex: number) => {
			if (phase !== "answering") return
			setSelectedAnswers((prev) => ({ ...prev, [itemIndex]: optionIndex }))
		},
		[phase],
	)

	const submit = useCallback(() => {
		if (!canSubmit) return
		setPhase("submitted")
		onComplete?.({ score, total })
	}, [canSubmit, score, total, onComplete])

	const reset = useCallback(() => {
		setPhase("answering")
		setSelectedAnswers({})
	}, [])

	const isCorrect = useCallback(
		(itemIndex: number): boolean | null => {
			if (phase !== "submitted") return null
			const selected = selectedAnswers[itemIndex]
			if (selected === undefined) return null
			return selected === items[itemIndex]?.correctIndex
		},
		[phase, selectedAnswers, items],
	)

	return {
		phase,
		supportMode,
		selectedAnswers,
		answeredCount,
		canSubmit,
		score,
		total,
		select,
		submit,
		reset,
		isCorrect,
	}
}

function computeScore(
	items: readonly McqSessionItem[],
	selectedAnswers: Record<number, number>,
): number {
	let correct = 0
	for (const [idxStr, optIdx] of Object.entries(selectedAnswers)) {
		const item = items[Number(idxStr)]
		if (item && item.correctIndex === optIdx) correct += 1
	}
	return correct
}
