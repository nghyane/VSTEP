import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { Icon } from "#/components/Icon"
import {
	type ShadowingAttemptResult,
	ShadowingSegmentView,
} from "#/features/practice/components/ShadowingSegmentView"
import { ShadowingSidebar } from "#/features/practice/components/ShadowingSidebar"
import { shadowingProgressQuery, useMarkShadowingDone } from "#/features/practice/shadowing-progress"
import type { ShadowingLessonDetail } from "#/features/practice/types"
import { useToast } from "#/lib/toast"
import {
	cn,
	compareWords,
	pickBoundaryEnglishVoice,
	pickEnglishVoice,
	speak,
	speechRecognitionNetworkMessage,
	stopSpeaking,
	warmupTTS,
} from "#/lib/utils"

interface Props {
	lesson: ShadowingLessonDetail
}

type MicState = "idle" | "listening" | "speaking" | "recording"

export function ShadowingInProgress({ lesson }: Props) {
	const { segments } = lesson
	const { data: progressData } = useQuery(shadowingProgressQuery)
	const markDoneMut = useMarkShadowingDone()
	const persistedDone = new Set((progressData?.data?.[lesson.id] ?? []).map((p) => p.segment_index))
	const [current, setCurrent] = useState(0)
	const [done, setDone] = useState<Set<number>>(new Set())
	const mergedDone = new Set([...persistedDone, ...done])
	const [voice, setVoice] = useState<SpeechSynthesisVoice | undefined>(() => pickBoundaryEnglishVoice())
	const [mic, setMic] = useState<MicState>("idle")
	const [speakingCharIndex, setSpeakingCharIndex] = useState(-1)
	const [elapsed, setElapsed] = useState(0)
	const [attempts, setAttempts] = useState<Map<number, ShadowingAttemptResult>>(new Map())
	const [sidebarOpen, setSidebarOpen] = useState(true)
	const [emptyWarning, setEmptyWarning] = useState(false)
	const recognitionRef = useRef<{ stop: () => void } | null>(null)
	const stoppedRef = useRef(false)
	const autoRestartRef = useRef(0)
	const timerRef = useRef<number | null>(null)
	const autoPlayedRef = useRef(false)

	const segment = segments[current]
	const attempt = attempts.get(current) ?? null

	useEffect(() => {
		if (voice) return
		const load = () => {
			const v = pickBoundaryEnglishVoice() ?? pickEnglishVoice()
			if (v) setVoice(v)
		}
		window.speechSynthesis?.addEventListener("voiceschanged", load)
		return () => window.speechSynthesis?.removeEventListener("voiceschanged", load)
	}, [voice])

	// Auto-play first segment on mount
	useEffect(() => {
		if (autoPlayedRef.current || !voice) return
		autoPlayedRef.current = true
		stopSpeaking()
		warmupTTS()
		setMic("speaking")
		setSpeakingCharIndex(-1)
		setTimeout(() => {
			speak(segment.text, {
				rate: 0.85,
				voice,
				boundaryFallback: false,
				onBoundary: (ci) => setSpeakingCharIndex(ci),
				onEnd: () => {
					setMic("idle")
					setSpeakingCharIndex(-1)
				},
			})
		}, 500)
	}, [voice, segment.text])

	const handleListen = () => {
		if (mic === "speaking") {
			stopSpeaking()
			setMic("idle")
			setSpeakingCharIndex(-1)
			return
		}
		if (mic !== "idle") return

		stopSpeaking()
		warmupTTS()
		setMic("speaking")
		setSpeakingCharIndex(-1)
		setTimeout(() => {
			speak(segment.text, {
				rate: 0.85,
				voice,
				boundaryFallback: false,
				onBoundary: (ci) => setSpeakingCharIndex(ci),
				onEnd: () => {
					setMic("idle")
					setSpeakingCharIndex(-1)
				},
			})
		}, 500)
	}

	const handleRecord = () => {
		if (mic === "recording") {
			stoppedRef.current = true
			recognitionRef.current?.stop()
			if (timerRef.current) clearInterval(timerRef.current)
			timerRef.current = null
			return
		}
		if (mic !== "idle") return

		stopSpeaking()
		setSpeakingCharIndex(-1)
		setEmptyWarning(false)

		const SR = window.SpeechRecognition || window.webkitSpeechRecognition
		if (!SR) {
			useToast.getState().add("Trình duyệt này không hỗ trợ nhận dạng giọng nói. Vui lòng dùng Chrome.")
			return
		}

		const recognition = new SR()
		recognition.lang = "en-US"
		recognition.continuous = true
		recognition.interimResults = true
		recognition.maxAlternatives = 1
		recognitionRef.current = recognition
		stoppedRef.current = false
		autoRestartRef.current = 0
		setElapsed(0)

		let transcript = ""
		recognition.onresult = (e: Event) => {
			const evt = e as unknown as { results: ArrayLike<{ 0: { transcript: string } }> }
			let full = ""
			for (let i = 0; i < evt.results.length; i++) full += evt.results[i][0].transcript
			transcript = full
		}
		recognition.onerror = (e: Event) => {
			const err = e as unknown as { error: string; message?: string }
			if (
				err.error === "not-allowed" ||
				err.error === "service-not-allowed" ||
				err.error === "audio-capture"
			) {
				stoppedRef.current = true
				recognition.abort()
				setMic("idle")
				if (timerRef.current) clearInterval(timerRef.current)
				timerRef.current = null
				useToast.getState().add("Không thể truy cập microphone. Kiểm tra cài đặt trình duyệt.")
				return
			}
			if (err.error === "network") {
				stoppedRef.current = true
				recognition.abort()
				setMic("idle")
				if (timerRef.current) clearInterval(timerRef.current)
				timerRef.current = null
				useToast.getState().add(speechRecognitionNetworkMessage(navigator.userAgent, navigator.onLine))
				return
			}
		}
		recognition.onend = () => {
			if (!stoppedRef.current) {
				autoRestartRef.current += 1
				if (autoRestartRef.current <= 3) {
					try {
						recognition.start()
						return
					} catch {
						/* fall through */
					}
				}
			}
			if (timerRef.current) clearInterval(timerRef.current)
			timerRef.current = null
			setMic("idle")
			const text = transcript.trim()
			if (text) {
				setEmptyWarning(false)
				const { results, correct } = compareWords(segment.text, text)
				const accuracyPercent =
					segment.word_count > 0 ? Math.min(100, Math.round((correct / segment.word_count) * 100)) : null
				setAttempts((prev) =>
					new Map(prev).set(current, {
						transcript: text,
						wordResults: results,
						correctCount: correct,
						accuracyPercent,
					}),
				)
				if (accuracyPercent !== null && accuracyPercent >= 50) {
					setDone((prev) => new Set(prev).add(current))
					markDoneMut.mutate({
						lesson_id: lesson.id,
						segment_index: current,
						accuracy_percent: accuracyPercent,
					})
				}
			} else {
				setEmptyWarning(true)
				setTimeout(() => setEmptyWarning(false), 3000)
			}
		}

		try {
			recognition.start()
			setMic("recording")
			const startTime = Date.now()
			timerRef.current = window.setInterval(() => {
				const sec = Math.floor((Date.now() - startTime) / 1000)
				setElapsed(sec)
				if (sec >= 30) {
					stoppedRef.current = true
					recognitionRef.current?.stop()
					if (timerRef.current) clearInterval(timerRef.current)
					timerRef.current = null
				}
			}, 200)
		} catch {
			setMic("idle")
		}
	}

	const goTo = (idx: number) => {
		stopSpeaking()
		setMic("idle")
		setSpeakingCharIndex(-1)
		if (mic === "recording") {
			stoppedRef.current = true
			recognitionRef.current?.stop()
		}
		if (timerRef.current) clearInterval(timerRef.current)
		timerRef.current = null
		setCurrent(idx)
	}

	// Auto-read when segment changes
	const prevSegment = useRef(current)
	useEffect(() => {
		if (prevSegment.current === current) return
		prevSegment.current = current
		if (!voice) return
		// Small delay for TTS engine to be ready (matches conversation pattern)
		const t = setTimeout(() => {
			stopSpeaking()
			warmupTTS()
			setMic("speaking")
			setSpeakingCharIndex(-1)
			speak(segments[current].text, {
				rate: 0.85,
				voice,
				boundaryFallback: false,
				onBoundary: (ci) => setSpeakingCharIndex(ci),
				onEnd: () => {
					setMic("idle")
					setSpeakingCharIndex(-1)
				},
			})
		}, 500)
		return () => clearTimeout(t)
	})

	useEffect(() => {
		return () => {
			stopSpeaking()
			recognitionRef.current?.stop()
			if (timerRef.current) clearInterval(timerRef.current)
		}
	}, [])

	return (
		<div className="flex flex-col h-screen bg-background">
			{/* Header */}
			<div className="flex items-center gap-3 border-b-2 border-border bg-surface px-4 py-2.5 shrink-0">
				<Link to="/luyen-tap/noi" className="p-1 hover:opacity-70 shrink-0">
					<Icon name="close" size="xs" className="text-muted" />
				</Link>
				<div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
					<div
						className="h-full bg-skill-speaking rounded-full transition-all"
						style={{ width: `${(mergedDone.size / segments.length) * 100}%` }}
					/>
				</div>
				<span className="text-xs font-bold text-muted shrink-0">
					{mergedDone.size}/{segments.length}
				</span>
				<button
					type="button"
					onClick={() => setSidebarOpen((v) => !v)}
					className="p-1.5 hover:opacity-70 shrink-0 lg:hidden"
				>
					<Icon name="more" size="xs" className="text-muted" />
				</button>
			</div>

			{/* Body */}
			<div className="flex-1 flex overflow-hidden">
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Scrollable content */}
					<div className="flex-1 overflow-y-auto">
						<div className="max-w-2xl mx-auto px-6 py-6">
							<ShadowingSegmentView
								segment={segment}
								isSpeaking={mic === "speaking"}
								speakingCharIndex={speakingCharIndex}
								onListen={handleListen}
								attempt={attempt}
							/>
						</div>
					</div>

					{/* Sticky footer */}
					<div className="border-t-2 border-border bg-surface shrink-0">
						<div className="max-w-2xl mx-auto px-6 py-4">
							{mic === "recording" ? (
								<div className="flex flex-col items-center gap-2">
									<div className="relative flex items-center justify-center w-28 h-28">
										<div className="absolute inset-0 rounded-full bg-destructive/25 animate-[micPulse_1.5s_ease-in-out_infinite]" />
										<button
											type="button"
											onClick={handleRecord}
											className="relative w-16 h-16 rounded-full bg-destructive text-primary-foreground flex items-center justify-center shadow-[0_4px_0_#b5322a] active:translate-y-[2px] active:shadow-[0_2px_0_#b5322a] transition"
										>
											<div className="w-5 h-5 rounded-sm bg-primary-foreground" />
										</button>
									</div>
									<p className="text-sm font-bold text-destructive tabular-nums">{elapsed}s / 30s</p>
								</div>
							) : mic === "speaking" ? (
								<div className="flex flex-col items-center gap-2">
									<div className="relative flex items-center justify-center w-28 h-28">
										<div className="absolute inset-0 rounded-full bg-skill-speaking/20 animate-[micPulse_1.5s_ease-in-out_infinite]" />
										<button
											type="button"
											onClick={handleListen}
											className="relative w-16 h-16 rounded-full bg-skill-speaking text-primary-foreground flex items-center justify-center shadow-[0_4px_0_var(--color-skill-speaking-dark)] active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-skill-speaking-dark)] transition"
										>
											<Icon name="volume" size="md" />
										</button>
									</div>
									<p className="text-xs font-bold text-skill-speaking">Đang phát · Nhấn để bỏ qua</p>
								</div>
							) : (
								<div className="flex flex-col items-center gap-1.5">
									{/* Nav + Mic in one row */}
									<div className="flex items-center justify-between w-full">
										<button
											type="button"
											onClick={() => current > 0 && goTo(current - 1)}
											disabled={current === 0}
											className="w-20 text-left text-sm font-bold text-muted hover:text-foreground transition disabled:opacity-30"
										>
											← Trước
										</button>
										<button
											type="button"
											onClick={handleRecord}
											className="w-16 h-16 rounded-full flex items-center justify-center transition shrink-0 bg-surface text-foreground border-2 border-b-4 border-border hover:border-skill-speaking active:translate-y-[2px] active:border-b-2"
										>
											<Icon name="mic" size="md" />
										</button>
										<button
											type="button"
											onClick={() => current < segments.length - 1 && goTo(current + 1)}
											disabled={current === segments.length - 1}
											className="w-20 text-right text-sm font-bold text-skill-speaking hover:text-foreground transition disabled:opacity-30"
										>
											Tiếp theo →
										</button>
									</div>
									<p className="text-xs font-bold text-muted">
										{attempt ? "Nhấn để thử lại" : "Nhấn để nhại theo"}
									</p>
									{emptyWarning && (
										<p className="text-xs font-bold text-warning animate-[fadeIn_0.2s_ease-out]">
											Không nghe rõ, vui lòng thử lại.
										</p>
									)}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Sidebar */}
				<div
					className={cn(
						"w-80 border-l-2 border-border bg-surface shrink-0",
						sidebarOpen ? "block" : "hidden lg:block",
					)}
				>
					<ShadowingSidebar segments={segments} current={current} done={mergedDone} onSelect={goTo} />
				</div>
			</div>
		</div>
	)
}
