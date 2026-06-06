import { useCallback, useEffect, useRef, useState } from "react"
import { transcribePracticeAudio } from "#/features/practice/actions"
import { speechRecognitionNetworkMessage } from "#/lib/utils"

export type SpeechTranscriberProvider = "web-speech" | "azure"

export interface SpeechTranscriberResult {
	transcript: string
	confidence: number
	provider: SpeechTranscriberProvider
}

interface SpeechTranscriberCallbacks {
	language?: string
	onStart: (provider: SpeechTranscriberProvider) => void
	onProcessing?: () => void
	onResult: (result: SpeechTranscriberResult) => void
	onEmpty: () => void
	onError: (message: string) => void
}

const MAX_WEB_SPEECH_RESTARTS = 3
const DEFAULT_LANGUAGE = "en-US"
const MIC_PERMISSION_MESSAGE = "Không thể truy cập microphone. Kiểm tra cài đặt trình duyệt."
const AZURE_UNAVAILABLE_MESSAGE =
	"Trình duyệt này không hỗ trợ ghi âm để dùng Azure. Vui lòng cập nhật trình duyệt hoặc dùng Chrome/Edge."

const AZURE_SAMPLE_RATE = 16_000

function speechRecognitionConstructor(): SpeechRecognitionConstructor | null {
	return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

function messageFromError(error: unknown): string {
	return error instanceof Error && error.message
		? error.message
		: "Không nhận diện được giọng nói. Vui lòng thử lại."
}

function normalizeTranscript(value: string): string {
	const transcript = value.trim()
	return /[\p{L}\p{N}]/u.test(transcript) ? transcript : ""
}

function downsampleBuffer(buffer: Float32Array, sourceRate: number, targetRate: number): Float32Array {
	if (targetRate === sourceRate) return buffer
	const ratio = sourceRate / targetRate
	const length = Math.round(buffer.length / ratio)
	const result = new Float32Array(length)
	let offset = 0
	for (let index = 0; index < length; index++) {
		const nextOffset = Math.round((index + 1) * ratio)
		let sum = 0
		let count = 0
		for (let sourceIndex = offset; sourceIndex < nextOffset && sourceIndex < buffer.length; sourceIndex++) {
			sum += buffer[sourceIndex]
			count++
		}
		result[index] = count > 0 ? sum / count : 0
		offset = nextOffset
	}
	return result
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
	const bytesPerSample = 2
	const dataLength = samples.length * bytesPerSample
	const buffer = new ArrayBuffer(44 + dataLength)
	const view = new DataView(buffer)
	const writeString = (offset: number, value: string) => {
		for (let index = 0; index < value.length; index++) view.setUint8(offset + index, value.charCodeAt(index))
	}

	writeString(0, "RIFF")
	view.setUint32(4, 36 + dataLength, true)
	writeString(8, "WAVE")
	writeString(12, "fmt ")
	view.setUint32(16, 16, true)
	view.setUint16(20, 1, true)
	view.setUint16(22, 1, true)
	view.setUint32(24, sampleRate, true)
	view.setUint32(28, sampleRate * bytesPerSample, true)
	view.setUint16(32, bytesPerSample, true)
	view.setUint16(34, 8 * bytesPerSample, true)
	writeString(36, "data")
	view.setUint32(40, dataLength, true)

	let offset = 44
	for (const sample of samples) {
		const clamped = Math.max(-1, Math.min(1, sample))
		view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
		offset += bytesPerSample
	}

	return new Blob([view], { type: "audio/wav" })
}

function mergeChunks(chunks: Float32Array[]): Float32Array {
	const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
	const result = new Float32Array(totalLength)
	let offset = 0
	for (const chunk of chunks) {
		result.set(chunk, offset)
		offset += chunk.length
	}
	return result
}

export function useSpeechTranscriber(maxSeconds: number) {
	const [elapsedSeconds, setElapsedSeconds] = useState(0)
	const callbacksRef = useRef<SpeechTranscriberCallbacks | null>(null)
	const providerRef = useRef<SpeechTranscriberProvider | null>(null)
	const recognitionRef = useRef<SpeechRecognition | null>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const audioContextRef = useRef<AudioContext | null>(null)
	const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
	const processorRef = useRef<ScriptProcessorNode | null>(null)
	const silentGainRef = useRef<GainNode | null>(null)
	const timerRef = useRef<number | null>(null)
	const chunksRef = useRef<Float32Array[]>([])
	const sampleRateRef = useRef(AZURE_SAMPLE_RATE)
	const transcriptRef = useRef("")
	const confidenceRef = useRef(0.9)
	const stoppedRef = useRef(false)
	const cancelledRef = useRef(false)
	const autoRestartRef = useRef(0)
	const preferAzureRef = useRef(false)

	const clearTimer = useCallback(() => {
		if (timerRef.current !== null) {
			clearInterval(timerRef.current)
			timerRef.current = null
		}
	}, [])

	const stopStream = useCallback(() => {
		if (!streamRef.current) return
		for (const track of streamRef.current.getTracks()) track.stop()
		streamRef.current = null
	}, [])

	const cleanupAudioGraph = useCallback(() => {
		processorRef.current?.disconnect()
		sourceRef.current?.disconnect()
		silentGainRef.current?.disconnect()
		processorRef.current = null
		sourceRef.current = null
		silentGainRef.current = null
		const audioContext = audioContextRef.current
		audioContextRef.current = null
		if (audioContext && audioContext.state !== "closed") void audioContext.close()
	}, [])

	const resetActiveRefs = useCallback(() => {
		recognitionRef.current = null
		chunksRef.current = []
		providerRef.current = null
	}, [])

	const startTimer = useCallback(
		(onTimeout: () => void) => {
			clearTimer()
			setElapsedSeconds(0)
			const startedAt = Date.now()
			timerRef.current = window.setInterval(() => {
				const seconds = Math.floor((Date.now() - startedAt) / 1000)
				setElapsedSeconds(seconds)
				if (seconds >= maxSeconds) onTimeout()
			}, 200)
		},
		[clearTimer, maxSeconds],
	)

	const startAudioCapture = useCallback(async (): Promise<boolean> => {
		if (!navigator.mediaDevices?.getUserMedia || typeof AudioContext === "undefined") return false

		const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
		if (cancelledRef.current) {
			for (const track of stream.getTracks()) track.stop()
			return false
		}

		streamRef.current = stream
		chunksRef.current = []
		const audioContext = new AudioContext()
		const source = audioContext.createMediaStreamSource(stream)
		const processor = audioContext.createScriptProcessor(4096, 1, 1)
		const silentGain = audioContext.createGain()
		silentGain.gain.value = 0
		audioContextRef.current = audioContext
		sourceRef.current = source
		processorRef.current = processor
		silentGainRef.current = silentGain
		sampleRateRef.current = audioContext.sampleRate

		processor.onaudioprocess = (event) => {
			chunksRef.current.push(new Float32Array(event.inputBuffer.getChannelData(0)))
		}

		source.connect(processor)
		processor.connect(silentGain)
		silentGain.connect(audioContext.destination)
		return true
	}, [])

	const finishEmpty = useCallback(() => {
		clearTimer()
		cleanupAudioGraph()
		stopStream()
		resetActiveRefs()
		const callbacks = callbacksRef.current
		callbacksRef.current = null
		callbacks?.onEmpty()
	}, [cleanupAudioGraph, clearTimer, resetActiveRefs, stopStream])

	const finishError = useCallback(
		(message: string) => {
			clearTimer()
			cleanupAudioGraph()
			stopStream()
			resetActiveRefs()
			const callbacks = callbacksRef.current
			callbacksRef.current = null
			callbacks?.onError(message)
		},
		[cleanupAudioGraph, clearTimer, resetActiveRefs, stopStream],
	)

	const finishResult = useCallback(
		(result: SpeechTranscriberResult) => {
			clearTimer()
			cleanupAudioGraph()
			stopStream()
			resetActiveRefs()
			const callbacks = callbacksRef.current
			callbacksRef.current = null
			callbacks?.onResult(result)
		},
		[cleanupAudioGraph, clearTimer, resetActiveRefs, stopStream],
	)

	const stopAzureRecording = useCallback(() => {
		clearTimer()
		cleanupAudioGraph()
		stopStream()
		callbacksRef.current?.onProcessing?.()

		const rawSamples = mergeChunks(chunksRef.current)
		chunksRef.current = []
		const samples = downsampleBuffer(rawSamples, sampleRateRef.current, AZURE_SAMPLE_RATE)
		const blob = encodeWav(samples, AZURE_SAMPLE_RATE)

		void (async () => {
			if (cancelledRef.current) return
			if (blob.size <= 44 || samples.length < AZURE_SAMPLE_RATE / 2) {
				finishEmpty()
				return
			}

			try {
				const callbacks = callbacksRef.current
				const response = await transcribePracticeAudio(blob, callbacks?.language ?? DEFAULT_LANGUAGE)
				if (cancelledRef.current) return
				const transcript = normalizeTranscript(response.data.transcript)
				if (!transcript) {
					finishEmpty()
					return
				}
				finishResult({
					transcript,
					confidence: response.data.confidence,
					provider: "azure",
				})
			} catch (error) {
				if (!cancelledRef.current) finishError(messageFromError(error))
			}
		})()
	}, [cleanupAudioGraph, clearTimer, finishEmpty, finishError, finishResult, stopStream])

	const stop = useCallback(() => {
		stoppedRef.current = true
		clearTimer()

		const recognition = recognitionRef.current
		if (recognition) {
			callbacksRef.current?.onProcessing?.()
			recognition.stop()
			return
		}

		if (providerRef.current === "azure") {
			stopAzureRecording()
		}
	}, [clearTimer, stopAzureRecording])

	const startAzure = useCallback(
		async (callbacks: SpeechTranscriberCallbacks) => {
			providerRef.current = "azure"

			if (!navigator.mediaDevices?.getUserMedia || typeof AudioContext === "undefined") {
				finishError(AZURE_UNAVAILABLE_MESSAGE)
				return
			}

			try {
				const started = await startAudioCapture()
				if (!started) {
					finishError(AZURE_UNAVAILABLE_MESSAGE)
					return
				}
				stoppedRef.current = false
				callbacks.onStart("azure")
				startTimer(() => {
					stoppedRef.current = true
					stopAzureRecording()
				})
			} catch {
				finishError(MIC_PERMISSION_MESSAGE)
			}
		},
		[finishError, startAudioCapture, startTimer, stopAzureRecording],
	)

	const startWebSpeech = useCallback(
		async (callbacks: SpeechTranscriberCallbacks, Recognition: SpeechRecognitionConstructor) => {
			const recognition = new Recognition()
			recognition.lang = callbacks.language ?? DEFAULT_LANGUAGE
			recognition.continuous = true
			recognition.interimResults = true
			recognition.maxAlternatives = 1
			recognitionRef.current = recognition
			transcriptRef.current = ""
			confidenceRef.current = 0.9
			stoppedRef.current = false
			autoRestartRef.current = 0

			recognition.onresult = (event) => {
				let transcript = ""
				let confidence = confidenceRef.current
				for (let index = 0; index < event.results.length; index++) {
					const alternative = event.results[index][0]
					transcript += alternative.transcript
					if (typeof alternative.confidence === "number") confidence = alternative.confidence
				}
				transcriptRef.current = transcript
				confidenceRef.current = confidence
			}

			recognition.onerror = (event) => {
				if (
					event.error === "not-allowed" ||
					event.error === "service-not-allowed" ||
					event.error === "audio-capture"
				) {
					stoppedRef.current = true
					recognition.abort()
					finishError(MIC_PERMISSION_MESSAGE)
					return
				}

				if (event.error === "network") {
					preferAzureRef.current = true
					stoppedRef.current = true
					recognition.onend = null
					recognition.abort()
					const transcript = normalizeTranscript(transcriptRef.current)
					if (transcript) {
						finishResult({ transcript, confidence: confidenceRef.current, provider: "web-speech" })
						return
					}
					if (navigator.onLine && chunksRef.current.length > 0) {
						callbacksRef.current?.onProcessing?.()
						stopAzureRecording()
						return
					}
					finishError(speechRecognitionNetworkMessage(navigator.userAgent, false))
				}
			}

			recognition.onend = () => {
				if (!stoppedRef.current) {
					autoRestartRef.current += 1
					if (autoRestartRef.current <= MAX_WEB_SPEECH_RESTARTS) {
						try {
							recognition.start()
							return
						} catch {
							finishError("Không khởi động lại được microphone. Vui lòng thử lại.")
							return
						}
					}
				}

				const transcript = normalizeTranscript(transcriptRef.current)
				if (transcript) {
					finishResult({ transcript, confidence: confidenceRef.current, provider: "web-speech" })
					return
				}
				if (navigator.onLine && chunksRef.current.length > 0) {
					preferAzureRef.current = true
					stopAzureRecording()
					return
				}
				finishEmpty()
			}

			try {
				await startAudioCapture().catch(() => false)
				recognition.start()
				providerRef.current = "web-speech"
				callbacks.onStart("web-speech")
				startTimer(() => {
					stoppedRef.current = true
					clearTimer()
					callbacksRef.current?.onProcessing?.()
					recognition.stop()
				})
			} catch {
				preferAzureRef.current = true
				cleanupAudioGraph()
				stopStream()
				chunksRef.current = []
				void startAzure(callbacks)
			}
		},
		[
			cleanupAudioGraph,
			clearTimer,
			finishEmpty,
			finishError,
			finishResult,
			startAudioCapture,
			startAzure,
			startTimer,
			stopAzureRecording,
			stopStream,
		],
	)

	const start = useCallback(
		async (callbacks: SpeechTranscriberCallbacks) => {
			if (providerRef.current) return
			callbacksRef.current = callbacks
			cancelledRef.current = false

			const Recognition = speechRecognitionConstructor()
			if (!preferAzureRef.current && Recognition) {
				await startWebSpeech(callbacks, Recognition)
				return
			}

			preferAzureRef.current = true
			await startAzure(callbacks)
		},
		[startAzure, startWebSpeech],
	)

	const abort = useCallback(() => {
		cancelledRef.current = true
		stoppedRef.current = true
		clearTimer()

		const recognition = recognitionRef.current
		if (recognition) {
			recognition.onend = null
			recognition.onerror = null
			recognition.onresult = null
			recognition.abort()
		}

		callbacksRef.current = null
		cleanupAudioGraph()
		stopStream()
		resetActiveRefs()
		setElapsedSeconds(0)
	}, [cleanupAudioGraph, clearTimer, resetActiveRefs, stopStream])

	useEffect(() => abort, [abort])

	return {
		elapsedSeconds,
		start,
		stop,
		abort,
	}
}
