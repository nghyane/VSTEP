// useSpeakingSession — phase state cho phiên luyện nói.
// Phase: ready → prep → speaking → done. Prep/Speak có timer đếm ngược.

import { useCallback, useEffect, useRef, useState } from "react"
import type { SpeakingExercise } from "#/lib/mock/speaking"
import { saveSpeakingProgress } from "#/lib/practice/speaking-progress"
import { useResetSupportModeOnMount } from "#/lib/practice/use-support-mode"
import { useVoiceRecorder, type VoiceRecorder } from "#/lib/practice/use-voice-recorder"

export type SpeakingPhase = "ready" | "prep" | "speaking" | "done"

export interface SpeakingSessionApi {
	phase: SpeakingPhase
	prepRemainingSec: number
	recorder: VoiceRecorder
	startPrep: () => void
	skipToSpeaking: () => void
	finish: () => void
	reset: () => void
}

const TICK_MS = 250

export function useSpeakingSession(exercise: SpeakingExercise): SpeakingSessionApi {
	useResetSupportModeOnMount()
	const [phase, setPhase] = useState<SpeakingPhase>("ready")
	const [prepRemainingSec, setPrepRemainingSec] = useState(exercise.prepSeconds)
	const prepEndRef = useRef<number | null>(null)
	const recorder = useVoiceRecorder(exercise.speakSeconds)

	const startSpeaking = useCallback(() => {
		setPhase("speaking")
		void recorder.start()
	}, [recorder])

	const startPrep = useCallback(() => {
		setPhase("prep")
		prepEndRef.current = Date.now() + exercise.prepSeconds * 1000
		setPrepRemainingSec(exercise.prepSeconds)
	}, [exercise.prepSeconds])

	const skipToSpeaking = useCallback(() => {
		prepEndRef.current = null
		startSpeaking()
	}, [startSpeaking])

	// Prep countdown
	useEffect(() => {
		if (phase !== "prep") return
		const id = window.setInterval(() => {
			const end = prepEndRef.current
			if (end === null) return
			const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000))
			setPrepRemainingSec(remaining)
			if (remaining <= 0) {
				prepEndRef.current = null
				startSpeaking()
			}
		}, TICK_MS)
		return () => window.clearInterval(id)
	}, [phase, startSpeaking])

	// Khi recorder dừng (hết giờ hoặc user stop) → move sang done
	useEffect(() => {
		if (phase === "speaking" && recorder.state === "stopped") {
			setPhase("done")
			saveSpeakingProgress(exercise.id, {
				status: "completed",
				recordedSeconds: Math.round(recorder.elapsedMs / 1000),
				lastAttemptAt: Date.now(),
			})
		}
	}, [phase, recorder.state, recorder.elapsedMs, exercise.id])

	const finish = useCallback(() => {
		recorder.stop()
	}, [recorder])

	const reset = useCallback(() => {
		recorder.reset()
		prepEndRef.current = null
		setPrepRemainingSec(exercise.prepSeconds)
		setPhase("ready")
	}, [recorder, exercise.prepSeconds])

	return { phase, prepRemainingSec, recorder, startPrep, skipToSpeaking, finish, reset }
}
