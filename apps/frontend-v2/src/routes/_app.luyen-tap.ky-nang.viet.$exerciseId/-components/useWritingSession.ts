// Writing session state — phase writing/submitted, text state, rule-based feedback.

import { useCallback, useMemo, useState } from "react"
import type { WritingExercise } from "#/lib/mock/writing"
import { useResetSupportModeOnMount } from "#/lib/practice/use-support-mode"
import { saveWritingProgress } from "#/lib/practice/writing-progress"

export type WritingPhase = "writing" | "submitted"

export interface KeywordHit {
	keyword: string
	hit: boolean
}

export interface WritingFeedback {
	wordCount: number
	wordCountInRange: boolean
	keywordsHit: KeywordHit[]
	keywordCoveragePct: number
	hasMultipleParagraphs: boolean
	stars: number // 0-5
}

export interface WritingSessionApi {
	phase: WritingPhase
	text: string
	wordCount: number
	canSubmit: boolean
	feedback: WritingFeedback | null
	setText: (text: string) => void
	insertTemplate: (template: string) => void
	submit: () => void
	submitAndGetFeedback: () => WritingFeedback | null
	reset: () => void
}

export function useWritingSession(exercise: WritingExercise): WritingSessionApi {
	useResetSupportModeOnMount()
	const [phase, setPhase] = useState<WritingPhase>("writing")
	const [text, setText] = useState("")

	const wordCount = useMemo(() => countWords(text), [text])
	const canSubmit = phase === "writing" && wordCount > 0

	const feedback = useMemo<WritingFeedback | null>(() => {
		if (phase !== "submitted") return null
		return computeFeedback(text, exercise)
	}, [phase, text, exercise])

	const submit = useCallback(() => {
		if (!canSubmit) return
		const result = computeFeedback(text, exercise)
		setPhase("submitted")
		saveWritingProgress(exercise.id, {
			status: "completed",
			wordCount: result.wordCount,
			keywordHitRate: result.keywordCoveragePct / 100,
			lastAttemptAt: Date.now(),
		})
	}, [canSubmit, text, exercise])

	const submitAndGetFeedback = useCallback((): WritingFeedback | null => {
		if (!canSubmit) return null
		const result = computeFeedback(text, exercise)
		setPhase("submitted")
		saveWritingProgress(exercise.id, {
			status: "completed",
			wordCount: result.wordCount,
			keywordHitRate: result.keywordCoveragePct / 100,
			lastAttemptAt: Date.now(),
		})
		return result
	}, [canSubmit, text, exercise])

	const reset = useCallback(() => {
		setPhase("writing")
		setText("")
	}, [])

	const insertTemplate = useCallback((template: string) => {
		setText((prev) => (prev.trim().length > 0 ? `${prev}\n${template}` : template))
	}, [])

	return {
		phase,
		text,
		wordCount,
		canSubmit,
		feedback,
		setText,
		insertTemplate,
		submit,
		submitAndGetFeedback,
		reset,
	}
}

// ─── Pure helpers ──────────────────────────────────────────────────

function countWords(text: string): number {
	return text.trim().split(/\s+/).filter(Boolean).length
}

function computeFeedback(text: string, exercise: WritingExercise): WritingFeedback {
	const wordCount = countWords(text)
	const wordCountInRange = wordCount >= exercise.minWords && wordCount <= exercise.maxWords

	const lowerText = text.toLowerCase()
	const keywordsHit: KeywordHit[] = exercise.keywords.map((kw) => ({
		keyword: kw,
		hit: lowerText.includes(kw.toLowerCase()),
	}))
	const hitCount = keywordsHit.filter((k) => k.hit).length
	const keywordCoveragePct =
		keywordsHit.length > 0 ? Math.round((hitCount / keywordsHit.length) * 100) : 0

	const paragraphCount = text.split(/\n\n+/).filter((p) => p.trim().length > 0).length
	const hasMultipleParagraphs = paragraphCount >= 2

	// Star heuristic: word count (2) + keyword coverage (up to 2) + structure (1)
	let stars = 0
	if (wordCountInRange) stars += 2
	else if (wordCount >= exercise.minWords * 0.8) stars += 1
	stars += Math.round((keywordCoveragePct / 100) * 2)
	if (hasMultipleParagraphs) stars += 1
	stars = Math.max(0, Math.min(5, stars))

	return {
		wordCount,
		wordCountInRange,
		keywordsHit,
		keywordCoveragePct,
		hasMultipleParagraphs,
		stars,
	}
}
