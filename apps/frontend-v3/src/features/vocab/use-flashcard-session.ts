import { useCallback, useEffect, useState } from "react"
import { reviewWord } from "#/features/vocab/actions"
import type { SrsRating, WordWithState } from "#/features/vocab/types"

interface FlashcardSession {
	current: WordWithState | undefined
	total: number
	index: number
	reviewed: number
	done: boolean
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

	const current = queue[index]
	const total = queue.length
	const done = total > 0 && index >= total

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

	// Keyboard: Space=reveal, 1-4=rate
	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === " ") {
				e.preventDefault()
				if (!revealed) reveal()
			}
			if (revealed && !submitting) {
				const r = Number(e.key)
				if (r >= 1 && r <= 4) rate(r as SrsRating)
			}
		}
		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	}, [revealed, submitting, reveal, rate])

	return { current, total, index: Math.min(index, total), reviewed, done, revealed, submitting, reveal, rate }
}
