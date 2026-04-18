// TTS audio player — Web Speech API. Subtitle mode highlights spoken words.

import { Captions, CaptionsOff, Pause, Play, RotateCcw } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { cn } from "#/shared/lib/utils"
import { SpeakerIcon } from "#/shared/ui/SpeakerIcon"

interface Props {
	transcript: string
}

type PlayState = "idle" | "playing" | "paused" | "ended"

const WORDS_PER_SECOND = 2.25
const TICK_MS = 200

export function TtsAudioPlayer({ transcript }: Props) {
	const durationSec = estimateDuration(transcript)
	const [state, setState] = useState<PlayState>("idle")
	const [playCount, setPlayCount] = useState(0)
	const [elapsedMs, setElapsedMs] = useState(0)
	const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null)
	const [spokenCharIndex, setSpokenCharIndex] = useState(-1)
	const [showSub, setShowSub] = useState(false)

	const startRef = useRef<number | null>(null)
	const accumulatedRef = useRef(0)

	useEnglishVoice(setVoice)
	useCleanupOnUnmount()
	useTickInterval(state, startRef, accumulatedRef, setElapsedMs)

	const currentSec = Math.min(Math.floor(elapsedMs / 1000), durationSec)

	const handlePlay = useCallback(() => {
		const utterance = new SpeechSynthesisUtterance(transcript)
		if (voice) utterance.voice = voice
		utterance.rate = 0.9
		utterance.onboundary = (e) => {
			if (e.name === "word") setSpokenCharIndex(e.charIndex)
		}
		utterance.onend = () => {
			setState("ended")
			startRef.current = null
			accumulatedRef.current = durationSec * 1000
		}
		utterance.onerror = () => {
			setState("idle")
			startRef.current = null
			accumulatedRef.current = 0
			setElapsedMs(0)
		}
		window.speechSynthesis.cancel()
		window.speechSynthesis.speak(utterance)
		accumulatedRef.current = 0
		startRef.current = Date.now()
		setElapsedMs(0)
		setSpokenCharIndex(-1)
		setState("playing")
		setPlayCount((c) => c + 1)
	}, [transcript, voice, durationSec])

	const handlePause = useCallback(() => {
		if (startRef.current !== null) {
			accumulatedRef.current += Date.now() - startRef.current
			startRef.current = null
		}
		window.speechSynthesis.pause()
		setState("paused")
	}, [])

	const handleResume = useCallback(() => {
		startRef.current = Date.now()
		window.speechSynthesis.resume()
		setState("playing")
	}, [])

	const handleStop = useCallback(() => {
		window.speechSynthesis.cancel()
		startRef.current = null
		accumulatedRef.current = 0
		setElapsedMs(0)
		setSpokenCharIndex(-1)
		setState("idle")
	}, [])

	const progressPct = durationSec > 0 ? (currentSec / durationSec) * 100 : 0
	const isPlaying = state === "playing"

	return (
		<div className="rounded-2xl border bg-card p-4 shadow-sm">
			<div className="flex items-center justify-between pb-3">
				<div className="inline-flex items-center gap-2 text-sm font-semibold">
					<SpeakerIcon active={isPlaying} className="size-4" />
					Nghe bài
				</div>
				<PlayCountBadge playCount={playCount} />
			</div>

			<div className="flex items-center gap-3">
				<PlayButton
					state={state}
					onPlay={handlePlay}
					onResume={handleResume}
					onPause={handlePause}
				/>
				<TimeDisplay seconds={currentSec} primary />
				<ProgressBar percent={progressPct} />
				<TimeDisplay seconds={durationSec} />
				<StopButton disabled={state === "idle"} onStop={handleStop} />
				<SubButton active={showSub} onToggle={() => setShowSub((v) => !v)} />
			</div>

			{!voice && state === "idle" && (
				<p className="mt-2 text-xs text-muted-foreground">Đang tải giọng đọc…</p>
			)}

			{showSub && spokenCharIndex >= 0 && (
				<SubtitleLine transcript={transcript} charIndex={spokenCharIndex} />
			)}
		</div>
	)
}

// ─── Sub-components ────────────────────────────────────────────────

function PlayButton({
	state,
	onPlay,
	onPause,
	onResume,
}: {
	state: PlayState
	onPlay: () => void
	onPause: () => void
	onResume: () => void
}) {
	const isPlaying = state === "playing"
	const isPaused = state === "paused"
	const handleClick = isPlaying ? onPause : isPaused ? onResume : onPlay

	return (
		<button
			type="button"
			onClick={handleClick}
			aria-label={isPlaying ? "Tạm dừng" : "Phát"}
			className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
		>
			{isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
		</button>
	)
}

function StopButton({ disabled, onStop }: { disabled: boolean; onStop: () => void }) {
	return (
		<button
			type="button"
			onClick={onStop}
			disabled={disabled}
			aria-label="Dừng và phát lại từ đầu"
			className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
		>
			<RotateCcw className="size-4" />
		</button>
	)
}

function SubButton({ active, onToggle }: { active: boolean; onToggle: () => void }) {
	return (
		<button
			type="button"
			onClick={onToggle}
			aria-label={active ? "Tắt phụ đề" : "Bật phụ đề"}
			className={cn(
				"flex size-8 items-center justify-center rounded-full transition-colors",
				active ? "text-primary" : "text-muted-foreground hover:text-foreground",
			)}
		>
			{active ? <Captions className="size-4" /> : <CaptionsOff className="size-4" />}
		</button>
	)
}

function ProgressBar({ percent }: { percent: number }) {
	return (
		<div
			role="progressbar"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={Math.round(percent)}
			aria-label="Tiến độ phát audio"
			className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
		>
			<div
				className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-150"
				style={{ width: `${percent}%` }}
			/>
		</div>
	)
}

function TimeDisplay({ seconds, primary }: { seconds: number; primary?: boolean }) {
	return (
		<span
			className={cn(
				"font-mono text-xs tabular-nums",
				primary ? "font-semibold text-primary" : "text-muted-foreground",
			)}
		>
			{formatTime(seconds)}
		</span>
	)
}

function PlayCountBadge({ playCount }: { playCount: number }) {
	return <span className="text-xs tabular-nums text-muted-foreground">Đã nghe {playCount} lần</span>
}

// ─── Subtitle line ─────────────────────────────────────────────────

function SubtitleLine({ transcript, charIndex }: { transcript: string; charIndex: number }) {
	// Split into sentences by . ? !
	const sentences = useMemo(() => {
		const result: { text: string; start: number; end: number }[] = []
		const regex = /[^.!?]+[.!?]+/g
		let match: RegExpExecArray | null = null
		while ((match = regex.exec(transcript)) !== null) {
			result.push({ text: match[0].trim(), start: match.index, end: match.index + match[0].length })
		}
		// If no sentence-ending punctuation, treat whole transcript as one sentence
		if (result.length === 0 && transcript.trim()) {
			result.push({ text: transcript.trim(), start: 0, end: transcript.length })
		}
		return result
	}, [transcript])

	// Find current sentence
	const current =
		charIndex >= 0 ? sentences.find((s) => charIndex >= s.start && charIndex < s.end) : null

	if (!current) {
		return <div className="mt-3 h-10 border-t pt-3" />
	}

	// Split current sentence into words, highlight spoken ones
	const words = current.text.split(/(\s+)/)
	const relativeIndex = charIndex - current.start

	return (
		<div className="mt-3 border-t pt-3">
			<p className="text-center text-sm leading-relaxed">
				{words.map((segment, i) => {
					if (/^\s+$/.test(segment)) return <span key={i}> </span>
					// Find this word's position in the original sentence
					const pos = current.text.indexOf(
						segment,
						i > 0 ? current.text.indexOf(words[i - 2] ?? "") + 1 : 0,
					)
					const spoken = relativeIndex >= pos
					return (
						<span
							key={i}
							className={spoken ? "font-semibold text-foreground" : "text-muted-foreground/40"}
						>
							{segment}
						</span>
					)
				})}
			</p>
		</div>
	)
}

// ─── Helpers ───────────────────────────────────────────────────────

function estimateDuration(transcript: string): number {
	const words = transcript.trim().split(/\s+/).filter(Boolean).length
	return Math.max(1, Math.round(words / WORDS_PER_SECOND))
}

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = Math.floor(seconds % 60)
	return `${m}:${String(s).padStart(2, "0")}`
}

// ─── Hooks ─────────────────────────────────────────────────────────

function useEnglishVoice(setVoice: (v: SpeechSynthesisVoice | null) => void): void {
	useEffect(() => {
		if (typeof window === "undefined" || !window.speechSynthesis) return
		const synth = window.speechSynthesis
		function loadVoice() {
			const voices = synth.getVoices()
			const picked =
				voices.find((v) => v.lang === "en-US") ??
				voices.find((v) => v.lang === "en-GB") ??
				voices.find((v) => v.lang.startsWith("en")) ??
				null
			setVoice(picked)
		}
		loadVoice()
		synth.addEventListener("voiceschanged", loadVoice)
		return () => synth.removeEventListener("voiceschanged", loadVoice)
	}, [setVoice])
}

function useCleanupOnUnmount(): void {
	useEffect(() => {
		return () => {
			if (typeof window !== "undefined" && window.speechSynthesis) {
				window.speechSynthesis.cancel()
			}
		}
	}, [])
}

function useTickInterval(
	state: PlayState,
	startRef: React.RefObject<number | null>,
	accumulatedRef: React.RefObject<number>,
	setElapsedMs: (v: number) => void,
): void {
	useEffect(() => {
		if (state !== "playing") return
		const id = window.setInterval(() => {
			const start = startRef.current
			const elapsed = accumulatedRef.current + (start !== null ? Date.now() - start : 0)
			setElapsedMs(elapsed)
		}, TICK_MS)
		return () => window.clearInterval(id)
	}, [state, startRef, accumulatedRef, setElapsedMs])
}
