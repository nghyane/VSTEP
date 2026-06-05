import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { Icon } from "#/components/Icon"
import {
	type ShadowingAttemptResult,
	ShadowingSegmentView,
} from "#/features/practice/components/ShadowingSegmentView"
import { ShadowingSidebar } from "#/features/practice/components/ShadowingSidebar"
import { TTSVoicePicker } from "#/features/practice/components/TTSVoicePicker"
import { shadowingProgressQuery, useMarkShadowingDone } from "#/features/practice/shadowing-progress"
import type { ShadowingLessonDetail } from "#/features/practice/types"
import { useSpeechTranscriber } from "#/features/practice/use-speech-transcriber"
import { detectProfanity } from "#/lib/profanity"
import { useToast } from "#/lib/toast"
import {
	cn,
	compareWords,
	pickBoundaryEnglishVoice,
	pickEnglishVoice,
	speak,
	stopSpeaking,
	warmupTTS,
} from "#/lib/utils"

interface Props {
	lesson: ShadowingLessonDetail
}

type MicState = "idle" | "speaking" | "recording" | "processing"
const VOICE_ERROR_MESSAGE =
	"Giọng đọc này không phát được trên trình duyệt hiện tại. Vui lòng chọn giọng khác."

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
	const [attempts, setAttempts] = useState<Map<number, ShadowingAttemptResult>>(new Map())
	const [sidebarOpen, setSidebarOpen] = useState(true)
	const [emptyWarning, setEmptyWarning] = useState(false)
	const {
		elapsedSeconds: elapsed,
		start: startSpeechTranscription,
		stop: stopSpeechTranscription,
		abort: abortSpeechTranscription,
	} = useSpeechTranscriber(30)
	const autoPlayedRef = useRef(false)

	const segment = segments[current]
	const attempt = attempts.get(current) ?? null
	const handleVoiceChange = useCallback((nextVoice: SpeechSynthesisVoice) => {
		stopSpeaking()
		setMic("idle")
		setSpeakingCharIndex(-1)
		setVoice(nextVoice)
	}, [])
	const handleVoiceError = useCallback(() => {
		setMic("idle")
		setSpeakingCharIndex(-1)
		useToast.getState().add(VOICE_ERROR_MESSAGE)
	}, [])

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
				onError: handleVoiceError,
				onEnd: () => {
					setMic("idle")
					setSpeakingCharIndex(-1)
				},
			})
		}, 500)
	}, [voice, segment.text, handleVoiceError])

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
				onError: handleVoiceError,
				onEnd: () => {
					setMic("idle")
					setSpeakingCharIndex(-1)
				},
			})
		}, 500)
	}

	const applyTranscript = (text: string) => {
		const profanity = detectProfanity(text)
		const { results, correct } = compareWords(segment.text, text)
		const accuracyPercent =
			segment.word_count > 0 && !profanity.found
				? Math.min(100, Math.round((correct / segment.word_count) * 100))
				: null
		setAttempts((prev) =>
			new Map(prev).set(current, {
				transcript: text,
				wordResults: profanity.found ? results.map((result) => ({ ...result, accuracy: "wrong" })) : results,
				correctCount: profanity.found ? 0 : correct,
				accuracyPercent,
				profanity,
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
	}

	const handleRecord = () => {
		if (mic === "recording") {
			stopSpeechTranscription()
			return
		}
		if (mic !== "idle") return

		stopSpeaking()
		setSpeakingCharIndex(-1)
		setEmptyWarning(false)

		void startSpeechTranscription({
			language: "en-US",
			onStart: () => setMic("recording"),
			onProcessing: () => setMic("processing"),
			onResult: ({ transcript }) => {
				setMic("idle")
				setEmptyWarning(false)
				applyTranscript(transcript)
			},
			onEmpty: () => {
				setMic("idle")
				setEmptyWarning(true)
				setTimeout(() => setEmptyWarning(false), 3000)
			},
			onError: (message) => {
				setMic("idle")
				useToast.getState().add(message)
			},
		})
	}

	const goTo = (idx: number) => {
		stopSpeaking()
		setMic("idle")
		setSpeakingCharIndex(-1)
		if (mic === "recording") {
			abortSpeechTranscription()
		}
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
				onError: handleVoiceError,
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
			abortSpeechTranscription()
		}
	}, [abortSpeechTranscription])

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
				<TTSVoicePicker
					voice={voice}
					onVoiceChange={handleVoiceChange}
					accentClassName="border-skill-speaking text-skill-speaking"
				/>
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
								key={`${segment.id}:${attempt?.transcript ?? ""}`}
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
							) : mic === "processing" ? (
								<div className="flex flex-col items-center gap-2 py-2">
									<div className="flex gap-1.5">
										<div className="w-2.5 h-2.5 rounded-full bg-skill-speaking animate-[dotBounce_1.2s_ease-in-out_infinite]" />
										<div
											className="w-2.5 h-2.5 rounded-full bg-skill-speaking animate-[dotBounce_1.2s_ease-in-out_infinite]"
											style={{ animationDelay: "0.2s" }}
										/>
										<div
											className="w-2.5 h-2.5 rounded-full bg-skill-speaking animate-[dotBounce_1.2s_ease-in-out_infinite]"
											style={{ animationDelay: "0.4s" }}
										/>
									</div>
									<p className="text-xs font-bold text-muted">Đang xử lý giọng nói…</p>
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
