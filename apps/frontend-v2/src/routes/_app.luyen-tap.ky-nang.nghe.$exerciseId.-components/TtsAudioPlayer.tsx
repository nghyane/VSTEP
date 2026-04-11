// TTS audio player — Web Speech API + UI tương tự v1 ListeningAudioBar.
// Ước lượng duration từ word count (~135 wpm khi rate 0.9), track elapsed qua interval.

import { Pause, Play, RotateCcw, Volume2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "#/lib/utils"

interface Props {
	transcript: string
	maxPlays: number | null
}

type PlayState = "idle" | "playing" | "paused" | "ended"

const WORDS_PER_SECOND = 2.25 // 135 wpm / 60
const TICK_MS = 200

export function TtsAudioPlayer({ transcript, maxPlays }: Props) {
	const durationSec = estimateDuration(transcript)
	const [state, setState] = useState<PlayState>("idle")
	const [playCount, setPlayCount] = useState(0)
	const [elapsedMs, setElapsedMs] = useState(0)
	const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null)

	const startRef = useRef<number | null>(null)
	const accumulatedRef = useRef(0)

	useEnglishVoice(setVoice)
	useCleanupOnUnmount()
	useTickInterval(state, startRef, accumulatedRef, setElapsedMs)

	const canPlay = maxPlays === null || playCount < maxPlays
	const reachedLimit = maxPlays !== null && playCount >= maxPlays
	const currentSec = Math.min(Math.floor(elapsedMs / 1000), durationSec)

	const handlePlay = useCallback(() => {
		if (!canPlay) return
		const utterance = new SpeechSynthesisUtterance(transcript)
		if (voice) utterance.voice = voice
		utterance.rate = 0.9
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
		setState("playing")
		setPlayCount((c) => c + 1)
	}, [canPlay, transcript, voice, durationSec])

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
		setState("idle")
	}, [])

	const progressPct = durationSec > 0 ? (currentSec / durationSec) * 100 : 0

	return (
		<div className="rounded-2xl border bg-card p-4 shadow-sm">
			<div className="flex items-center justify-between pb-3">
				<div className="inline-flex items-center gap-2 text-sm font-semibold">
					<Volume2 className="size-4 text-skill-listening" />
					Nghe bài
				</div>
				<PlayCountBadge playCount={playCount} maxPlays={maxPlays} reachedLimit={reachedLimit} />
			</div>

			<div className="flex items-center gap-3">
				<PlayButton
					state={state}
					canPlay={canPlay}
					onPlay={handlePlay}
					onResume={handleResume}
					onPause={handlePause}
				/>
				<TimeDisplay seconds={currentSec} primary />
				<ProgressBar percent={progressPct} />
				<TimeDisplay seconds={durationSec} />
				<StopButton disabled={state === "idle"} onStop={handleStop} />
			</div>

			{!voice && state === "idle" && (
				<p className="mt-2 text-xs text-muted-foreground">Đang tải giọng đọc…</p>
			)}
		</div>
	)
}

// ─── Sub-components ────────────────────────────────────────────────

function PlayButton({
	state,
	canPlay,
	onPlay,
	onPause,
	onResume,
}: {
	state: PlayState
	canPlay: boolean
	onPlay: () => void
	onPause: () => void
	onResume: () => void
}) {
	const isPlaying = state === "playing"
	const isPaused = state === "paused"
	const handleClick = isPlaying ? onPause : isPaused ? onResume : onPlay
	const disabled = !canPlay && state !== "playing" && state !== "paused"

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={disabled}
			aria-label={isPlaying ? "Tạm dừng" : "Phát"}
			className={cn(
				"flex size-10 items-center justify-center rounded-full text-primary-foreground transition-colors",
				disabled
					? "cursor-not-allowed bg-muted text-muted-foreground"
					: "bg-primary hover:bg-primary/90",
			)}
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

function PlayCountBadge({
	playCount,
	maxPlays,
	reachedLimit,
}: {
	playCount: number
	maxPlays: number | null
	reachedLimit: boolean
}) {
	if (maxPlays === null) {
		return (
			<span className="text-xs text-muted-foreground tabular-nums">
				Đã nghe {playCount} lần · không giới hạn
			</span>
		)
	}
	return (
		<span
			className={cn(
				"text-xs tabular-nums",
				reachedLimit ? "font-semibold text-destructive" : "text-muted-foreground",
			)}
		>
			Đã nghe {playCount}/{maxPlays} lần
			{reachedLimit && " · hết lượt"}
		</span>
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
