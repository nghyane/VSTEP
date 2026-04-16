// useSpeakingSession — state cho bài luyện Nói mới (Dictation + Shadowing).

import { useCallback, useEffect, useRef, useState } from "react"
import type { SpeakingExercise } from "#/lib/mock/speaking"
import { type DictationResult, diffDictation } from "#/lib/practice/dictation-diff"
import { cancelSpeak, speakSentence } from "#/lib/practice/speak-sentence"
import { saveSpeakingProgress } from "#/lib/practice/speaking-progress"

export type SpeakingMode = "dictation" | "shadowing"

export interface DictationSentenceState {
	typed: string
	checked: boolean
	result: DictationResult | null
}

export interface ShadowingSentenceState {
	audioUrl: string | null
	recordedMs: number
	playCount: number
}

export interface SpeakingSessionApi {
	mode: SpeakingMode
	setMode: (m: SpeakingMode) => void
	currentIndex: number
	setCurrentIndex: (i: number) => void
	// dictation
	dictation: readonly DictationSentenceState[]
	setDictationTyped: (i: number, text: string) => void
	checkDictation: (i: number) => void
	revealDictation: (i: number) => void
	playCurrent: (rate?: number) => Promise<void>
	isPlaying: boolean
	// shadowing
	shadowing: readonly ShadowingSentenceState[]
	recordShadow: (i: number, audioUrl: string, ms: number) => void
	// summary
	dictationAccuracy: number
	shadowingDone: number
	saveSnapshot: () => void
}

function emptyDictation(n: number): DictationSentenceState[] {
	return Array.from({ length: n }, () => ({ typed: "", checked: false, result: null }))
}
function emptyShadowing(n: number): ShadowingSentenceState[] {
	return Array.from({ length: n }, () => ({ audioUrl: null, recordedMs: 0, playCount: 0 }))
}

export function useSpeakingSession(exercise: SpeakingExercise): SpeakingSessionApi {
	const n = exercise.sentences.length
	const [mode, setMode] = useState<SpeakingMode>("dictation")
	const [currentIndex, setCurrentIndex] = useState(0)
	const [dictation, setDictation] = useState<DictationSentenceState[]>(() => emptyDictation(n))
	const [shadowing, setShadowing] = useState<ShadowingSentenceState[]>(() => emptyShadowing(n))
	const [isPlaying, setIsPlaying] = useState(false)
	const playingRef = useRef(false)

	const shadowingRef = useRef(shadowing)
	shadowingRef.current = shadowing

	useEffect(() => {
		return () => {
			cancelSpeak()
			for (const s of shadowingRef.current) if (s.audioUrl) URL.revokeObjectURL(s.audioUrl)
		}
	}, [])

	const setDictationTyped = useCallback((i: number, text: string) => {
		setDictation((prev) =>
			prev.map((s, idx) => (idx === i ? { ...s, typed: text, checked: false, result: null } : s)),
		)
	}, [])

	const checkDictation = useCallback(
		(i: number) => {
			setDictation((prev) =>
				prev.map((s, idx) => {
					if (idx !== i) return s
					const expected = exercise.sentences[i]?.text ?? ""
					return { ...s, checked: true, result: diffDictation(expected, s.typed) }
				}),
			)
		},
		[exercise.sentences],
	)

	const revealDictation = useCallback(
		(i: number) => {
			const expected = exercise.sentences[i]?.text ?? ""
			setDictation((prev) =>
				prev.map((s, idx) =>
					idx === i
						? { ...s, typed: expected, checked: true, result: diffDictation(expected, expected) }
						: s,
				),
			)
		},
		[exercise.sentences],
	)

	const playCurrent = useCallback(
		async (rate = 1) => {
			if (playingRef.current) return
			const sentence = exercise.sentences[currentIndex]
			if (!sentence) return
			playingRef.current = true
			setIsPlaying(true)
			if (mode === "shadowing") {
				setShadowing((prev) =>
					prev.map((s, idx) => (idx === currentIndex ? { ...s, playCount: s.playCount + 1 } : s)),
				)
			}
			await speakSentence(sentence.text, { rate })
			playingRef.current = false
			setIsPlaying(false)
		},
		[exercise.sentences, currentIndex, mode],
	)

	const recordShadow = useCallback((i: number, audioUrl: string, ms: number) => {
		setShadowing((prev) =>
			prev.map((s, idx) => {
				if (idx !== i) return s
				if (s.audioUrl) URL.revokeObjectURL(s.audioUrl)
				return { ...s, audioUrl, recordedMs: ms }
			}),
		)
	}, [])

	const dictationAccuracy = (() => {
		const checked = dictation.filter((d) => d.checked && d.result)
		if (checked.length === 0) return 0
		const sum = checked.reduce((a, d) => a + (d.result?.accuracy ?? 0), 0)
		return sum / checked.length
	})()
	const shadowingDone = shadowing.filter((s) => s.audioUrl !== null).length

	const saveSnapshot = useCallback(() => {
		saveSpeakingProgress(exercise.id, {
			status: dictationAccuracy > 0 || shadowingDone > 0 ? "in_progress" : "not_started",
			dictationAccuracy,
			shadowingDone,
			sentencesTotal: n,
			lastAttemptAt: Date.now(),
		})
	}, [exercise.id, dictationAccuracy, shadowingDone, n])

	return {
		mode,
		setMode,
		currentIndex,
		setCurrentIndex,
		dictation,
		setDictationTyped,
		checkDictation,
		revealDictation,
		playCurrent,
		isPlaying,
		shadowing,
		recordShadow,
		dictationAccuracy,
		shadowingDone,
		saveSnapshot,
	}
}
