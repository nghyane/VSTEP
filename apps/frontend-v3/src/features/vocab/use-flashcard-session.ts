import { useCallback, useEffect, useState } from "react"
import { reviewWord } from "#/features/vocab/actions"
import type { SrsRating, WordWithState } from "#/features/vocab/types"

const KEY_TO_RATING: Record<string, SrsRating> = { "1": 1, "2": 2, "3": 3, "4": 4 }

type Status = "empty" | "active" | "done"

interface FlashcardSession {
	status: Status
	current: WordWithState | null
	index: number
	total: number
	reviewed: number
	revealed: boolean
	submitting: boolean
	reveal: () => void
	rate: (rating: SrsRating) => void
}

export function useFlashcardSession(items: WordWithState[]): FlashcardSession {
	const [queue, setQueue] = useState<WordWithState[]>([])
	const [index, setIndex] = useState(0)
	const [reviewed, setReviewed] = useState(0)
	const [revealed, setRevealed] = useState(false)
	const [submitting, setSubmitting] = useState(false)

	useEffect(() => {
		if (items.length > 0) setQueue(items)
	}, [items])

	const total = queue.length
	const current = queue[index] ?? null

	let status: Status = "active"
	if (total === 0) status = "empty"
	else if (index >= total) status = "done"

	const reveal = useCallback(() => setRevealed(true), [])

	const rate = useCallback(async (rating: SrsRating) => {
		if (!current || submitting) return
		setSubmitting(true)
		await reviewWord(current.word.id, rating)
		setReviewed((r) => r + 1)
		if (rating === 1) setQueue((q) => [...q, current])
		setRevealed(false)
		setIndex((i) => i + 1)
		setSubmitting(false)
	}, [current, submitting])

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === " " && !revealed) {
				e.preventDefault()
				reveal()
				return
			}
			const rating = KEY_TO_RATING[e.key]
			if (rating && revealed && !submitting) {
				rate(rating)
			}
		}
		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	}, [revealed, submitting, reveal, rate])

	return { status, current, index, total, reviewed, revealed, submitting, reveal, rate }
}
