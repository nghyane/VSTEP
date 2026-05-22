import { useEffect, useRef } from "react"

interface Options {
	playing: boolean
	activeWordIndex: number
	totalWords: number
	wordDuration: number
}

/** Lerp factor per frame ~60fps: 15% khoảng cách còn lại → hội tụ ~99% sau 500ms */
const LERP = 0.15

/**
 * Trả về ref gắn vào fill div của progress bar.
 * Update DOM trực tiếp qua RAF + exponential lerp — không qua React state.
 */
export function useSmoothProgressBar({ playing, activeWordIndex, totalWords, wordDuration }: Options) {
	const fillRef = useRef<HTMLDivElement | null>(null)
	const rafRef = useRef(0)
	const wordStartTimeRef = useRef(0)
	const displayRef = useRef(0)
	const stateRef = useRef({ activeWordIndex, totalWords, wordDuration })

	stateRef.current = { activeWordIndex, totalWords, wordDuration }

	// biome-ignore lint/correctness/useExhaustiveDependencies: wordStartTimeRef is a ref
	useEffect(() => {
		wordStartTimeRef.current = Date.now()
	}, [activeWordIndex])

	useEffect(() => {
		cancelAnimationFrame(rafRef.current)

		if (!playing) {
			const { activeWordIndex: idx, totalWords: total } = stateRef.current
			if (idx < 0) displayRef.current = 0
			const pct = idx < 0 || total <= 0 ? 0 : Math.min(100, ((idx + 1) / total) * 100)
			if (fillRef.current) fillRef.current.style.width = `${pct}%`
			return
		}

		const tick = () => {
			const { activeWordIndex: idx, totalWords: total, wordDuration: dur } = stateRef.current
			if (fillRef.current && total > 0 && idx >= 0) {
				const frac = dur > 0 ? Math.min(1, (Date.now() - wordStartTimeRef.current) / dur) : 1
				const target = Math.min(100, ((idx + frac) / total) * 100)
				displayRef.current = Math.max(
					displayRef.current,
					displayRef.current + (target - displayRef.current) * LERP,
				)
				fillRef.current.style.width = `${displayRef.current}%`
			}
			rafRef.current = requestAnimationFrame(tick)
		}

		rafRef.current = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(rafRef.current)
	}, [playing])

	return fillRef
}
