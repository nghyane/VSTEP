import { useSuspenseQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import {
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Eye,
	Headphones,
	Mic,
	Pause,
	Play,
	RotateCcw,
	Square,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { SpeakerIcon } from "#/components/common/SpeakerIcon"
import { Button } from "#/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs"
import { SPEAKING_LEVEL_LABELS, type SpeakingExercise } from "#/lib/mock/speaking"
import type { DictationToken } from "#/lib/practice/dictation-diff"
import { saveSpeakingResult } from "#/lib/practice/result-storage"
import { cancelSpeak } from "#/lib/practice/speak-sentence"
import { useVoiceRecorder } from "#/lib/practice/use-voice-recorder"
import { speakingExerciseQueryOptions } from "#/lib/queries/speaking"
import { cn } from "#/lib/utils"
import { useSpeakingSession } from "./useSpeakingSession"

const SPEEDS = [0.75, 1, 1.25] as const
type Speed = (typeof SPEEDS)[number]

export function SessionView({ exerciseId }: { exerciseId: string }) {
	const { data: exercise } = useSuspenseQuery(speakingExerciseQueryOptions(exerciseId))
	const session = useSpeakingSession(exercise)
	const navigate = useNavigate()

	const handleSubmit = () => {
		session.saveSnapshot()
		saveSpeakingResult({
			exerciseId,
			mode: session.mode,
			dictationAccuracy: session.dictationAccuracy,
			sentencesDone:
				session.mode === "dictation"
					? session.dictation.filter((d) => d.checked).length
					: session.shadowingDone,
			sentencesTotal: exercise.sentences.length,
			submittedAt: Date.now(),
		})
		toast.success("Đã lưu kết quả")
		void navigate({ to: "/luyen-tap/ky-nang/noi/$exerciseId/ket-qua", params: { exerciseId } })
	}

	return (
		<div className="mt-4 space-y-6 pb-28">
			<Header exercise={exercise} />
			<Tabs value={session.mode} onValueChange={(v) => session.setMode(v as typeof session.mode)}>
				<TabsList className="w-full max-w-md">
					<TabsTrigger value="dictation" className="flex-1 gap-2">
						<Headphones className="size-4" /> Dictation
					</TabsTrigger>
					<TabsTrigger value="shadowing" className="flex-1 gap-2">
						<Mic className="size-4" /> Shadowing
					</TabsTrigger>
				</TabsList>
				<TabsContent value="dictation" className="mt-4">
					<SentenceNav
						total={exercise.sentences.length}
						current={session.currentIndex}
						onChange={session.setCurrentIndex}
						markers={session.dictation.map((d) => d.checked)}
					/>
					<DictationPanel exercise={exercise} session={session} />
				</TabsContent>
				<TabsContent value="shadowing" className="mt-4">
					<SentenceNav
						total={exercise.sentences.length}
						current={session.currentIndex}
						onChange={session.setCurrentIndex}
						markers={session.shadowing.map((s) => s.audioUrl !== null)}
					/>
					<ShadowingPanel exercise={exercise} session={session} />
				</TabsContent>
			</Tabs>
			<footer
				data-session-footer
				className="fixed right-0 bottom-0 left-[var(--dock-left)] z-20 flex items-center justify-end border-t bg-background px-6 py-4"
			>
				<Button size="lg" className="rounded-xl px-8" onClick={handleSubmit}>
					Kết thúc & xem tổng kết
				</Button>
			</footer>
		</div>
	)
}

// ─── Header ────────────────────────────────────────────────────────

function Header({ exercise }: { exercise: SpeakingExercise }) {
	return (
		<header>
			<p className="text-xs font-semibold uppercase tracking-wide text-skill-speaking">
				{SPEAKING_LEVEL_LABELS[exercise.level]}
			</p>
			<div className="mt-1 flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold">{exercise.title}</h1>
					<p className="mt-1 text-sm text-muted-foreground">{exercise.description}</p>
				</div>
				<p className="shrink-0 text-sm text-muted-foreground">
					{exercise.sentences.length} câu · {exercise.estimatedMinutes} phút
				</p>
			</div>
		</header>
	)
}

// ─── Sentence nav ──────────────────────────────────────────────────

function SentenceNav({
	total,
	current,
	onChange,
	markers,
}: {
	total: number
	current: number
	onChange: (i: number) => void
	markers: readonly boolean[]
}) {
	return (
		<div className="flex items-center gap-2 rounded-xl bg-muted/50 p-2">
			<Button
				size="icon"
				variant="ghost"
				disabled={current === 0}
				onClick={() => onChange(current - 1)}
			>
				<ChevronLeft className="size-4" />
			</Button>
			<div className="flex flex-1 flex-wrap justify-center gap-1.5">
				{Array.from({ length: total }, (_, i) => (
					<button
						key={i}
						type="button"
						onClick={() => onChange(i)}
						className={cn(
							"flex size-8 items-center justify-center rounded-md text-xs font-semibold transition-colors",
							i === current
								? "bg-skill-speaking text-white"
								: markers[i]
									? "bg-success/15 text-success hover:bg-success/25"
									: "bg-background hover:bg-muted",
						)}
					>
						{i + 1}
					</button>
				))}
			</div>
			<Button
				size="icon"
				variant="ghost"
				disabled={current >= total - 1}
				onClick={() => onChange(current + 1)}
			>
				<ChevronRight className="size-4" />
			</Button>
		</div>
	)
}

// ─── Audio bar (media-player style, match Listening TtsAudioPlayer) ──

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
			const el = (Date.now() - startRef.current) / 1000
			setElapsed(Math.min(el, duration))
		}, 150)
		return () => window.clearInterval(id)
	}, [isPlaying, duration])

	const pct = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0

	return (
		<div className="rounded-2xl border bg-card p-4 shadow-sm">
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
								{s}x {s === 0.75 && "(chậm)"} {s === 1 && "(bình thường)"}
								{s === 1.25 && "(nhanh)"}
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

// ─── Dictation ─────────────────────────────────────────────────────

function DictationPanel({
	exercise,
	session,
}: {
	exercise: SpeakingExercise
	session: ReturnType<typeof useSpeakingSession>
}) {
	const i = session.currentIndex
	const sentence = exercise.sentences[i]
	const state = session.dictation[i]
	const [speed, setSpeed] = useState<Speed>(1)
	if (!sentence || !state) return null

	return (
		<div className="mt-4 space-y-4 rounded-2xl bg-muted/50 p-5 shadow-sm">
			<div className="flex items-center justify-between gap-3">
				<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Câu {i + 1} / {exercise.sentences.length}
				</span>
			</div>

			<AudioBar
				text={sentence.text}
				isPlaying={session.isPlaying}
				speed={speed}
				onSpeedChange={setSpeed}
				onPlay={() => void session.playCurrent(speed)}
				onStop={cancelSpeak}
			/>

			<textarea
				value={state.typed}
				onChange={(e) => session.setDictationTyped(i, e.target.value)}
				placeholder="Nghe và gõ lại câu bạn nghe được…"
				rows={3}
				className="w-full resize-none rounded-xl border bg-background p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-skill-speaking/40"
			/>

			<div className="flex flex-wrap items-center gap-2">
				<Button onClick={() => session.checkDictation(i)} disabled={state.typed.trim() === ""}>
					<Check className="size-4" /> Kiểm tra
				</Button>
				<Button variant="outline" onClick={() => session.revealDictation(i)}>
					<Eye className="size-4" /> Xem đáp án
				</Button>
				{sentence.translation && (
					<span className="ml-auto text-xs italic text-muted-foreground">
						{sentence.translation}
					</span>
				)}
			</div>

			{state.checked && state.result && (
				<div className="space-y-2 rounded-xl bg-background p-3">
					<p className="text-xs font-semibold text-muted-foreground">
						Kết quả: {Math.round(state.result.accuracy * 100)}% đúng ({state.result.correct}/
						{state.result.total} từ)
					</p>
					<DictationDiff tokens={state.result.tokens} />
				</div>
			)}
		</div>
	)
}

function DictationDiff({ tokens }: { tokens: readonly DictationToken[] }) {
	return (
		<p className="text-sm leading-relaxed">
			{tokens.map((t, idx) => (
				<span
					key={`${t.expected}-${idx}`}
					className={cn(
						"mr-1 inline-block rounded px-1",
						t.status === "correct" && "bg-success/15 text-success",
						t.status === "wrong" && "bg-destructive/15 text-destructive line-through",
						t.status === "missing" && "bg-warning/15 text-warning italic",
					)}
				>
					{t.expected}
				</span>
			))}
		</p>
	)
}

// ─── Shadowing ─────────────────────────────────────────────────────

function ShadowingPanel({
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
		<div className="mt-4 space-y-4 rounded-2xl bg-muted/50 p-5 shadow-sm">
			<div className="flex items-center justify-between gap-3">
				<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Câu {i + 1} / {exercise.sentences.length}
				</span>
			</div>

			{/* Câu mẫu */}
			<div className="rounded-xl bg-background p-5">
				<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Câu mẫu
				</p>
				<p className="mt-2 text-lg font-medium leading-relaxed">{sentence.text}</p>
				{sentence.translation && (
					<p className="mt-2 text-sm italic text-muted-foreground">{sentence.translation}</p>
				)}
			</div>

			{/* Audio bar */}
			<AudioBar
				text={sentence.text}
				isPlaying={session.isPlaying}
				speed={speed}
				onSpeedChange={setSpeed}
				onPlay={() => void session.playCurrent(speed)}
				onStop={cancelSpeak}
			/>

			{/* Record CTA */}
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

			{/* Compare */}
			{state.audioUrl && (
				<div className="space-y-3 rounded-xl bg-background p-4">
					<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						So sánh
					</p>
					<PlaybackRow
						label="Audio mẫu"
						onPlay={() => void session.playCurrent(speed)}
						playing={session.isPlaying}
					/>
					<PlaybackRow label="Bản ghi của bạn" audioUrl={state.audioUrl} />
				</div>
			)}
		</div>
	)
}

function PlaybackRow({
	label,
	audioUrl,
	onPlay,
	playing,
}: {
	label: string
	audioUrl?: string
	onPlay?: () => void
	playing?: boolean
}) {
	return (
		<div className="flex items-center gap-3">
			<span className="w-32 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
			{audioUrl ? (
				<audio src={audioUrl} controls className="h-9 flex-1">
					<track kind="captions" />
				</audio>
			) : (
				<Button size="sm" variant="outline" onClick={onPlay} disabled={playing}>
					{playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />} Phát
				</Button>
			)}
		</div>
	)
}
