// useVoiceRecorder — wrapper quanh MediaRecorder API.
// Effect sync với external API (mic stream, MediaRecorder) là đúng mục đích.

import { useCallback, useEffect, useRef, useState } from "react"

export type RecorderState = "idle" | "requesting" | "recording" | "stopped" | "denied"

export interface VoiceRecorder {
	state: RecorderState
	elapsedMs: number
	audioBlob: Blob | null
	audioUrl: string | null
	error: string | null
	start: () => Promise<void>
	stop: () => void
	reset: () => void
}

const TICK_MS = 100

export function useVoiceRecorder(maxSeconds: number): VoiceRecorder {
	const [state, setState] = useState<RecorderState>("idle")
	const [elapsedMs, setElapsedMs] = useState(0)
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
	const [audioUrl, setAudioUrl] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	const streamRef = useRef<MediaStream | null>(null)
	const recorderRef = useRef<MediaRecorder | null>(null)
	const chunksRef = useRef<Blob[]>([])
	const startedAtRef = useRef<number | null>(null)
	const tickRef = useRef<number | null>(null)
	const maxMsRef = useRef(maxSeconds * 1000)

	maxMsRef.current = maxSeconds * 1000

	const cleanupStream = useCallback(() => {
		if (streamRef.current) {
			for (const track of streamRef.current.getTracks()) {
				track.stop()
			}
			streamRef.current = null
		}
	}, [])

	const clearTick = useCallback(() => {
		if (tickRef.current !== null) {
			window.clearInterval(tickRef.current)
			tickRef.current = null
		}
	}, [])

	const stop = useCallback(() => {
		const recorder = recorderRef.current
		if (recorder && recorder.state !== "inactive") recorder.stop()
		clearTick()
		cleanupStream()
	}, [clearTick, cleanupStream])

	const start = useCallback(async () => {
		if (state === "recording") return
		setError(null)
		setState("requesting")
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			streamRef.current = stream
			const mimeType = pickMimeType()
			const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
			recorderRef.current = recorder
			chunksRef.current = []

			recorder.ondataavailable = (e) => {
				if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
			}
			recorder.onstop = () => {
				const blob = new Blob(chunksRef.current, { type: mimeType ?? "audio/webm" })
				if (audioUrl) URL.revokeObjectURL(audioUrl)
				setAudioBlob(blob)
				setAudioUrl(URL.createObjectURL(blob))
				setState("stopped")
			}

			recorder.start()
			startedAtRef.current = Date.now()
			setElapsedMs(0)
			setState("recording")

			tickRef.current = window.setInterval(() => {
				if (startedAtRef.current === null) return
				const el = Date.now() - startedAtRef.current
				setElapsedMs(el)
				if (el >= maxMsRef.current) stop()
			}, TICK_MS)
		} catch (err) {
			cleanupStream()
			setState("denied")
			setError(
				err instanceof Error
					? err.message
					: "Không thể truy cập micro. Vui lòng kiểm tra quyền hoặc thử lại.",
			)
		}
	}, [state, audioUrl, stop, cleanupStream])

	const reset = useCallback(() => {
		stop()
		if (audioUrl) URL.revokeObjectURL(audioUrl)
		chunksRef.current = []
		startedAtRef.current = null
		recorderRef.current = null
		setElapsedMs(0)
		setAudioBlob(null)
		setAudioUrl(null)
		setError(null)
		setState("idle")
	}, [audioUrl, stop])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			clearTick()
			cleanupStream()
			if (recorderRef.current && recorderRef.current.state !== "inactive") {
				recorderRef.current.stop()
			}
		}
	}, [clearTick, cleanupStream])

	// Revoke URL on unmount
	useEffect(() => {
		return () => {
			if (audioUrl) URL.revokeObjectURL(audioUrl)
		}
	}, [audioUrl])

	return { state, elapsedMs, audioBlob, audioUrl, error, start, stop, reset }
}

function pickMimeType(): string | null {
	if (typeof MediaRecorder === "undefined") return null
	const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]
	for (const mime of candidates) {
		if (MediaRecorder.isTypeSupported(mime)) return mime
	}
	return null
}
