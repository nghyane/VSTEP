// useSpeakingSession — state cho bài luyện Nói (Shadowing).

import { useCallback, useEffect, useRef, useState } from "react"
import type { SpeakingExercise } from "#/lib/mock/speaking"
import { cancelSpeak, speakSentence } from "#/lib/practice/speak-sentence"
import { saveSpeakingProgress } from "#/lib/practice/speaking-progress"

export type SpeakingPhase = "practicing" | "submitted"

export interface ShadowingSentenceState {
	audioUrl: string | null
	recordedMs: number
	playCount: number
}

export interface SpeakingSessionApi {
	phase: SpeakingPhase
	currentIndex: number
	setCurrentIndex: (i: number) => void
	playCurrent: (rate?: number) => Promise<void>
	isPlaying: boolean
	// shadowing
	shadowing: readonly ShadowingSentenceState[]
	recordShadow: (i: number, audioUrl: string, ms: number) => void
	// summary
	shadowingDone: number
	total: number
	canSubmit: boolean
	submit: () => void
	reset: () => void
	saveSnapshot: () => void
}

function emptyShadowing(n: number): ShadowingSentenceState[] {
	return Array.from({ length: n }, () => ({ audioUrl: null, recordedMs: 0, playCount: 0 }))
}

export function useSpeakingSession(exercise: SpeakingExercise): SpeakingSessionApi {
	const n = exercise.sentences.length
	const [phase, setPhase] = useState<SpeakingPhase>("practicing")
	const [currentIndex, setCurrentIndex] = useState(0)
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

	const playCurrent = useCallback(
		async (rate = 1) => {
			if (playingRef.current) return
			const sentence = exercise.sentences[currentIndex]
			if (!sentence) return
			playingRef.current = true
			setIsPlaying(true)
			setShadowing((prev) =>
				prev.map((s, idx) => (idx === currentIndex ? { ...s, playCount: s.playCount + 1 } : s)),
			)
			await speakSentence(sentence.text, { rate })
			playingRef.current = false
			setIsPlaying(false)
		},
		[exercise.sentences, currentIndex],
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

	const shadowingDone = shadowing.filter((s) => s.audioUrl !== null).length
	const canSubmit = shadowingDone > 0

	const submit = useCallback(() => {
		setPhase("submitted")
	}, [])

	const reset = useCallback(() => {
		setPhase("practicing")
		setCurrentIndex(0)
		for (const s of shadowingRef.current) if (s.audioUrl) URL.revokeObjectURL(s.audioUrl)
		setShadowing(emptyShadowing(n))
	}, [n])

	const saveSnapshot = useCallback(() => {
		saveSpeakingProgress(exercise.id, {
			status: shadowingDone > 0 ? "in_progress" : "not_started",
			dictationAccuracy: 0,
			shadowingDone,
			sentencesTotal: n,
			lastAttemptAt: Date.now(),
		})
	}, [exercise.id, shadowingDone, n])

	return {
		phase,
		currentIndex,
		setCurrentIndex,
		playCurrent,
		isPlaying,
		shadowing,
		recordShadow,
		shadowingDone,
		total: n,
		canSubmit,
		submit,
		reset,
		saveSnapshot,
	}
}
