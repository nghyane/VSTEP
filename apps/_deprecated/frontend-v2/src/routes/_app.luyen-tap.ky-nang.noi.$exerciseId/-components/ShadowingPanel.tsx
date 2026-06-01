// ShadowingPanel — panel luyện nhại câu với audio bar và recorder.

import { ChevronDown, ChevronRight, Mic, Pause, Play, RotateCcw, Square } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { cancelSpeak } from "#/features/practice/lib/speak-sentence"
import { useVoiceRecorder } from "#/features/practice/lib/use-voice-recorder"
import type { SpeakingExercise } from "#/mocks/speaking"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/shared/ui/dropdown-menu"
import { SpeakerIcon } from "#/shared/ui/SpeakerIcon"
import type { useSpeakingSession } from "./useSpeakingSession"

const SPEEDS = [0.75, 1, 1.25] as const
type Speed = (typeof SPEEDS)[number]
const WORDS_PER_SECOND = 2.25

function estimateDuration(text: string, speed: number): number {
	const words = text.trim().split(/\s+/).filter(Boolean).length
	return Math.max(1, Math.round(words / (WORDS_PER_SECOND * speed)))
}

function formatTime(s: number): string {
	const m = Math.floor(s / 60)
	const sec = Math.floor(s % 60)
	return `${m}:${String(sec).padStart(2, "0")}`
}

function AudioBar({
	text,
	isPlaying,
	speed,
	onSpeedChange,
	onPlay,
	onStop,
}: {
	text: string
	isPlaying: boolean
	speed: Speed
	onSpeedChange: (s: Speed) => void
	onPlay: () => void
	onStop: () => void
}) {
	const duration = estimateDuration(text, speed)
	const [elapsed, setElapsed] = useState(0)
	const startRef = useRef<number | null>(null)

	useEffect(() => {
		if (!isPlaying) {
			startRef.current = null
			setElapsed(0)
			return
		}
		startRef.current = Date.now()
		setElapsed(0)
		const id = window.setInterval(() => {
			if (startRef.current === null) return
			setElapsed(Math.min((Date.now() - startRef.current) / 1000, duration))
		}, 150)
		return () => window.clearInterval(id)
	}, [isPlaying, duration])

	const pct = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0

	return (
		<div className="rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-4">
			<div className="flex items-center justify-between pb-3">
				<div className="inline-flex items-center gap-2 text-sm font-semibold">
					<SpeakerIcon active={isPlaying} className="size-4" />
					Nghe câu
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs font-semibold">
							Tốc độ {speed}x <ChevronDown className="size-3" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{SPEEDS.map((s) => (
							<DropdownMenuItem
								key={s}
								onClick={() => onSpeedChange(s)}
								className={cn(speed === s && "font-semibold text-skill-speaking")}
							>
								{s}x {s === 0.75 && "(chậm)"} {s === 1 && "(bình thường)"} {s === 1.25 && "(nhanh)"}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={onPlay}
					aria-label={isPlaying ? "Đang phát" : "Phát"}
					disabled={isPlaying}
					className={cn(
						"flex size-10 shrink-0 items-center justify-center rounded-full text-primary-foreground transition-colors",
						isPlaying
							? "cursor-not-allowed bg-muted text-muted-foreground"
							: "bg-skill-speaking hover:bg-skill-speaking/90",
					)}
				>
					{isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
				</button>
				<span className="font-mono text-xs font-semibold tabular-nums text-skill-speaking">
					{formatTime(elapsed)}
				</span>
				<div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
					<div
						className="absolute inset-y-0 left-0 rounded-full bg-skill-speaking transition-[width] duration-150"
						style={{ width: `${pct}%` }}
					/>
				</div>
				<span className="font-mono text-xs tabular-nums text-muted-foreground">
					{formatTime(duration)}
				</span>
				<button
					type="button"
					onClick={onStop}
					disabled={!isPlaying && elapsed === 0}
					aria-label="Dừng & phát lại"
					className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
				>
					<RotateCcw className="size-4" />
				</button>
			</div>
		</div>
	)
}

export function ShadowingPanel({
	exercise,
	session,
}: {
	exercise: SpeakingExercise
	session: ReturnType<typeof useSpeakingSession>
}) {
	const i = session.currentIndex
	const sentence = exercise.sentences[i]
	const state = session.shadowing[i]
	const recorder = useVoiceRecorder(15)
	const prevStateRef = useRef(recorder.state)
	const [speed, setSpeed] = useState<Speed>(1)

	useEffect(() => {
		if (prevStateRef.current === "recording" && recorder.state === "stopped" && recorder.audioUrl) {
			session.recordShadow(i, recorder.audioUrl, recorder.elapsedMs)
		}
		prevStateRef.current = recorder.state
	}, [recorder.state, recorder.audioUrl, recorder.elapsedMs, i, session])

	const handleRecord = useCallback(() => {
		if (recorder.state === "recording") recorder.stop()
		else void recorder.start()
	}, [recorder])
	if (!sentence || !state) return null
	const isRecording = recorder.state === "recording"

	return (
		<div className="space-y-4 rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-5">
			<div className="flex items-center justify-between gap-3">
				<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Câu {i + 1} / {exercise.sentences.length}
				</span>
			</div>
			<div className="rounded-xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-5">
				<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Câu mẫu
				</p>
				<p className="mt-2 text-lg font-medium leading-relaxed">{sentence.text}</p>
				{sentence.translation && (
					<p className="mt-2 text-sm italic text-muted-foreground">{sentence.translation}</p>
				)}
			</div>
			<AudioBar
				text={sentence.text}
				isPlaying={session.isPlaying}
				speed={speed}
				onSpeedChange={setSpeed}
				onPlay={() => void session.playCurrent(speed)}
				onStop={cancelSpeak}
			/>
			<div className="flex flex-col items-center gap-2 py-2">
				<Button
					size="lg"
					variant={isRecording ? "destructive" : "default"}
					onClick={handleRecord}
					className="h-14 min-w-52 rounded-full text-base shadow-md"
				>
					{isRecording ? (
						<>
							<Square className="size-5" /> Dừng ({Math.round(recorder.elapsedMs / 1000)}s)
						</>
					) : (
						<>
							<Mic className="size-5" /> {state.audioUrl ? "Ghi lại" : "Bắt đầu nhại"}
						</>
					)}
				</Button>
				<p className="text-xs text-muted-foreground">
					{isRecording
						? "Đang ghi âm… bấm Dừng khi xong"
						: state.audioUrl
							? "Bạn có thể ghi lại nếu chưa ưng ý"
							: "Nghe mẫu vài lần, sau đó bấm để nhại theo"}
				</p>
			</div>
			{recorder.error && <p className="text-center text-xs text-destructive">{recorder.error}</p>}
			{state.audioUrl && (
				<div className="rounded-xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-4">
					<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Bản ghi của bạn
					</p>
					<audio src={state.audioUrl} controls className="h-9 w-full">
						<track kind="captions" />
					</audio>
				</div>
			)}
			{state.audioUrl && !isRecording && i < exercise.sentences.length - 1 && (
				<Button
					type="button"
					variant="outline"
					onClick={() => session.setCurrentIndex(i + 1)}
					className="w-full"
				>
					Câu tiếp theo <ChevronRight className="size-4" />
				</Button>
			)}
		</div>
	)
}
