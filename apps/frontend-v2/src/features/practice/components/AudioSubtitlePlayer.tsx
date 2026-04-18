// AudioSubtitlePlayer — phát audio + subtitle sync.
// Nếu có wordTimestamps (từ Whisper): sync chính xác từng chữ.
// Nếu không có: fallback TTS với onboundary.

import { Captions, CaptionsOff, Pause, Play, RotateCcw } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { WordTimestamp } from "#/mocks/listening"
import { cn } from "#/shared/lib/utils"
import { SpeakerIcon } from "#/shared/ui/SpeakerIcon"

interface Props {
	audioUrl?: string
	transcript: string
	wordTimestamps?: readonly WordTimestamp[]
}

type PlayState = "idle" | "playing" | "paused" | "ended"

export function AudioSubtitlePlayer({ audioUrl, transcript, wordTimestamps }: Props) {
	const audioRef = useRef<HTMLAudioElement>(null)
	const [state, setState] = useState<PlayState>("idle")
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const [showSub, setShowSub] = useState(true)

	// TTS fallback state
	const useTts = !audioUrl
	const [ttsCharIndex, setTtsCharIndex] = useState(-1)
	const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null)
	const ttsStartRef = useRef(0)

	// Load voice for TTS
	useEffect(() => {
		if (!useTts) return
		const synth = window.speechSynthesis
		function load() {
			const voices = synth.getVoices()
			setVoice(
				voices.find((v) => v.lang === "en-US") ??
					voices.find((v) => v.lang.startsWith("en")) ??
					null,
			)
		}
		load()
		synth.addEventListener("voiceschanged", load)
		return () => synth.removeEventListener("voiceschanged", load)
	}, [useTts])

	// Audio element events
	useEffect(() => {
		const el = audioRef.current
		if (!el || useTts) return
		const onTime = () => setCurrentTime(el.currentTime)
		const onMeta = () => setDuration(el.duration)
		const onEnd = () => setState("ended")
		el.addEventListener("timeupdate", onTime)
		el.addEventListener("loadedmetadata", onMeta)
		el.addEventListener("ended", onEnd)
		return () => {
			el.removeEventListener("timeupdate", onTime)
			el.removeEventListener("loadedmetadata", onMeta)
			el.removeEventListener("ended", onEnd)
		}
	}, [useTts])

	// TTS elapsed timer
	useEffect(() => {
		if (!useTts || state !== "playing") return
		const id = setInterval(() => setCurrentTime((Date.now() - ttsStartRef.current) / 1000), 150)
		return () => clearInterval(id)
	}, [useTts, state])

	const handlePlay = useCallback(() => {
		if (useTts) {
			const u = new SpeechSynthesisUtterance(transcript)
			if (voice) u.voice = voice
			u.rate = 0.9
			u.onboundary = (e) => {
				if (e.name === "word") setTtsCharIndex(e.charIndex)
			}
			u.onend = () => setState("ended")
			setDuration(transcript.split(/\s+/).length / 2.25)
			window.speechSynthesis.cancel()
			window.speechSynthesis.speak(u)
			ttsStartRef.current = Date.now()
			setCurrentTime(0)
			setTtsCharIndex(-1)
		} else {
			const el = audioRef.current
			if (!el) return
			el.currentTime = 0
			void el.play()
		}
		setState("playing")
	}, [useTts, transcript, voice])

	const handlePause = useCallback(() => {
		if (useTts) window.speechSynthesis.pause()
		else audioRef.current?.pause()
		setState("paused")
	}, [useTts])

	const handleResume = useCallback(() => {
		if (useTts) {
			ttsStartRef.current = Date.now() - currentTime * 1000
			window.speechSynthesis.resume()
		} else {
			void audioRef.current?.play()
		}
		setState("playing")
	}, [useTts, currentTime])

	const handleStop = useCallback(() => {
		if (useTts) window.speechSynthesis.cancel()
		else {
			const el = audioRef.current
			if (el) {
				el.pause()
				el.currentTime = 0
			}
		}
		setCurrentTime(0)
		setTtsCharIndex(-1)
		setState("idle")
	}, [useTts])

	useEffect(
		() => () => {
			window.speechSynthesis.cancel()
		},
		[],
	)

	const isPlaying = state === "playing"
	const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
	const hasPlayed = ttsCharIndex >= 0 || currentTime > 0

	return (
		<div className="rounded-2xl border bg-card p-4 shadow-sm">
			{!useTts && (
				<audio ref={audioRef} src={audioUrl} preload="metadata">
					<track kind="captions" />
				</audio>
			)}

			<div className="flex items-center justify-between pb-3">
				<div className="inline-flex items-center gap-2 text-sm font-semibold">
					<SpeakerIcon active={isPlaying} className="size-4" />
					Nghe bài
				</div>
			</div>

			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={isPlaying ? handlePause : state === "paused" ? handleResume : handlePlay}
					aria-label={isPlaying ? "Tạm dừng" : "Phát"}
					className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
				>
					{isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
				</button>
				<span className="font-mono text-xs font-semibold tabular-nums text-primary">
					{fmt(currentTime)}
				</span>
				<div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
					<div
						className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-150"
						style={{ width: `${pct}%` }}
					/>
				</div>
				<span className="font-mono text-xs tabular-nums text-muted-foreground">
					{fmt(duration)}
				</span>
				<button
					type="button"
					onClick={handleStop}
					disabled={state === "idle"}
					aria-label="Dừng"
					className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground disabled:opacity-40"
				>
					<RotateCcw className="size-4" />
				</button>
				<button
					type="button"
					onClick={() => setShowSub((v) => !v)}
					aria-label="Phụ đề"
					className={cn(
						"flex size-8 items-center justify-center rounded-full",
						showSub ? "text-primary" : "text-muted-foreground hover:text-foreground",
					)}
				>
					{showSub ? <Captions className="size-4" /> : <CaptionsOff className="size-4" />}
				</button>
			</div>

			{showSub &&
				hasPlayed &&
				(wordTimestamps && wordTimestamps.length > 0 ? (
					<TimestampSubtitle words={wordTimestamps} currentTime={currentTime} />
				) : (
					<TtsSubtitle transcript={transcript} charIndex={ttsCharIndex} />
				))}
		</div>
	)
}

// ─── Timestamp-based subtitle (Whisper) ────────────────────────────

function TimestampSubtitle({
	words,
	currentTime,
}: {
	words: readonly WordTimestamp[]
	currentTime: number
}) {
	// Group words into sentences (split at . ? !)
	const sentences = useMemo(() => {
		const result: { words: readonly WordTimestamp[]; startTime: number; endTime: number }[] = []
		let buf: WordTimestamp[] = []
		for (const w of words) {
			buf.push(w)
			if (/[.!?]$/.test(w.word)) {
				result.push({
					words: buf,
					startTime: buf[0]?.start ?? 0,
					endTime: w.end,
				})
				buf = []
			}
		}
		if (buf.length > 0) {
			result.push({
				words: buf,
				startTime: buf[0]?.start ?? 0,
				endTime: buf[buf.length - 1]?.end ?? 0,
			})
		}
		return result
	}, [words])

	// Find current sentence
	const current =
		sentences.find((s) => currentTime >= s.startTime && currentTime < s.endTime + 0.5) ??
		(currentTime > 0 ? [...sentences].reverse().find((s) => currentTime >= s.startTime) : null)

	if (!current) return null

	return (
		<div className="mt-3 border-t pt-3">
			<p className="text-center text-sm leading-relaxed">
				{current.words.map((w) => (
					<span
						key={w.start}
						className={
							currentTime >= w.start ? "font-semibold text-foreground" : "text-muted-foreground/40"
						}
					>
						{w.word}{" "}
					</span>
				))}
			</p>
		</div>
	)
}

// ─── TTS fallback subtitle ─────────────────────────────────────────

function TtsSubtitle({ transcript, charIndex }: { transcript: string; charIndex: number }) {
	const sentences = useMemo(() => {
		const result: { text: string; start: number; end: number }[] = []
		const regex = /[^.!?]+[.!?]+/g
		let m: RegExpExecArray | null = null
		while ((m = regex.exec(transcript)) !== null) {
			result.push({ text: m[0].trim(), start: m.index, end: m.index + m[0].length })
		}
		if (result.length === 0 && transcript.trim()) {
			result.push({ text: transcript.trim(), start: 0, end: transcript.length })
		}
		return result
	}, [transcript])

	const current =
		charIndex >= 0 ? sentences.find((s) => charIndex >= s.start && charIndex < s.end) : null
	if (!current) return null

	const words = current.text.split(/(\s+)/)
	const rel = charIndex - current.start

	return (
		<div className="mt-3 border-t pt-3">
			<p className="text-center text-sm leading-relaxed">
				{words.map((seg, i) => {
					if (/^\s+$/.test(seg)) return <span key={i}> </span>
					const pos = current.text.indexOf(
						seg,
						i > 0 ? current.text.indexOf(words[i - 2] ?? "") + 1 : 0,
					)
					return (
						<span
							key={i}
							className={rel >= pos ? "font-semibold text-foreground" : "text-muted-foreground/40"}
						>
							{seg}
						</span>
					)
				})}
			</p>
		</div>
	)
}

// ─── Helpers ───────────────────────────────────────────────────────

function fmt(s: number): string {
	const m = Math.floor(s / 60)
	const sec = Math.floor(s % 60)
	return `${m}:${String(sec).padStart(2, "0")}`
}
