import { useCallback, useEffect, useRef, useState } from "react"

export type RecorderState = "idle" | "requesting" | "recording" | "stopped" | "denied"

export interface VoiceRecorder {
	state: RecorderState
	elapsedMs: number
	audioUrl: string | null
	error: string | null
	analyser: AnalyserNode | null
	start: () => Promise<void>
	stop: () => void
	reset: () => void
}

export function useVoiceRecorder(maxSeconds: number): VoiceRecorder {
	const [state, setState] = useState<RecorderState>("idle")
	const [elapsedMs, setElapsedMs] = useState(0)
	const [audioUrl, setAudioUrl] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

	const streamRef = useRef<MediaStream | null>(null)
	const recorderRef = useRef<MediaRecorder | null>(null)
	const audioCtxRef = useRef<AudioContext | null>(null)
	const chunksRef = useRef<Blob[]>([])
	const tickRef = useRef<number | null>(null)
	const startRef = useRef<number | null>(null)
	const maxMs = maxSeconds * 1000

	const cleanup = useCallback(() => {
		if (tickRef.current !== null) {
			clearInterval(tickRef.current)
			tickRef.current = null
		}
		if (streamRef.current) {
			for (const t of streamRef.current.getTracks()) t.stop()
			streamRef.current = null
		}
		if (audioCtxRef.current) {
			audioCtxRef.current.close()
			audioCtxRef.current = null
		}
		setAnalyser(null)
	}, [])

	const stop = useCallback(() => {
		const r = recorderRef.current
		if (r && r.state !== "inactive") r.stop()
		cleanup()
	}, [cleanup])

	const start = useCallback(async () => {
		if (state === "recording") return
		setError(null)
		setState("requesting")
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			streamRef.current = stream

			// Setup analyser
			const ctx = new AudioContext()
			audioCtxRef.current = ctx
			const source = ctx.createMediaStreamSource(stream)
			const node = ctx.createAnalyser()
			node.fftSize = 64
			source.connect(node)
			setAnalyser(node)

			const recorder = new MediaRecorder(stream)
			recorderRef.current = recorder
			chunksRef.current = []

			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) chunksRef.current.push(e.data)
			}
			recorder.onstop = () => {
				const blob = new Blob(chunksRef.current, { type: "audio/webm" })
				if (audioUrl) URL.revokeObjectURL(audioUrl)
				setAudioUrl(URL.createObjectURL(blob))
				setState("stopped")
			}

			recorder.start()
			startRef.current = Date.now()
			setElapsedMs(0)
			setState("recording")

			tickRef.current = window.setInterval(() => {
				if (startRef.current === null) return
				const el = Date.now() - startRef.current
				setElapsedMs(el)
				if (el >= maxMs) stop()
			}, 100)
		} catch {
			cleanup()
			setState("denied")
			setError("Không thể truy cập micro. Vui lòng kiểm tra quyền.")
		}
	}, [state, audioUrl, maxMs, stop, cleanup])

	const reset = useCallback(() => {
		stop()
		if (audioUrl) URL.revokeObjectURL(audioUrl)
		chunksRef.current = []
		recorderRef.current = null
		setElapsedMs(0)
		setAudioUrl(null)
		setError(null)
		setState("idle")
	}, [audioUrl, stop])

	useEffect(() => {
		return () => {
			if (tickRef.current !== null) clearInterval(tickRef.current)
			if (streamRef.current) for (const t of streamRef.current.getTracks()) t.stop()
			if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop()
			if (audioCtxRef.current) audioCtxRef.current.close()
		}
	}, [])

	useEffect(() => {
		return () => {
			if (audioUrl) URL.revokeObjectURL(audioUrl)
		}
	}, [audioUrl])

	return { state, elapsedMs, audioUrl, error, analyser, start, stop, reset }
}
