import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { ChevronDown, ChevronRight, Mic, Pause, Play, RotateCcw, Square } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { SpeakerIcon } from "#/components/common/SpeakerIcon"
import { saveSpeakingResult } from "#/lib/practice/result-storage"
import { cancelSpeak } from "#/lib/practice/speak-sentence"
import { useVoiceRecorder } from "#/lib/practice/use-voice-recorder"
import { speakingExerciseQueryOptions } from "#/lib/queries/speaking"
import { SPEAKING_LEVEL_LABELS, type SpeakingExercise } from "#/mocks/speaking"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/shared/ui/dropdown-menu"
import { useSpeakingSession } from "./useSpeakingSession"

const SPEEDS = [0.75, 1, 1.25] as const
type Speed = (typeof SPEEDS)[number]

export function SessionView({ exerciseId }: { exerciseId: string }) {
	const { data: exercise } = useSuspenseQuery(speakingExerciseQueryOptions(exerciseId))
	const session = useSpeakingSession(exercise)
	const navigate = useNavigate()
	const submitted = session.phase === "submitted"

	const handleSubmit = () => {
		session.saveSnapshot()
		saveSpeakingResult({
			exerciseId,
			mode: "shadowing",
			dictationAccuracy: 0,
			sentencesDone: session.shadowingDone,
			sentencesTotal: exercise.sentences.length,
			submittedAt: Date.now(),
		})
		toast.success("Đã nộp bài")
		void navigate({ to: "/luyen-tap/ky-nang/noi/$exerciseId/ket-qua", params: { exerciseId } })
	}

	return (
		<div className="mt-4 space-y-6">
			<Header exercise={exercise} />
			<ShadowingPanel exercise={exercise} session={session} />
			<div aria-hidden className="h-24" />
			<div
				data-session-footer
				className="fixed right-0 bottom-0 left-[var(--dock-left)] z-20 border-t bg-background px-6 py-3"
			>
				<div className="flex items-center gap-4">
					<div className="shrink-0">
						<SpeakingStatusText
							phase={session.phase}
							done={session.shadowingDone}
							total={session.total}
						/>
					</div>
					<div className="min-w-0 flex-1 overflow-x-auto">
						<div className="flex justify-center">
							<SpeakingNavBar
								total={session.total}
								markers={session.shadowing.map((s) => s.audioUrl !== null)}
								submitted={submitted}
								onChange={session.setCurrentIndex}
							/>
						</div>
					</div>
					<div className="shrink-0">
						<SpeakingSubmitAction
							phase={session.phase}
							canSubmit={session.canSubmit}
							onSubmit={handleSubmit}
							onReset={session.reset}
						/>
					</div>
				</div>
			</div>
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

// ─── Footer: Status text ───────────────────────────────────────────

function SpeakingStatusText({
	phase,
	done,
	total,
}: {
	phase: "practicing" | "submitted"
	done: number
	total: number
}) {
	if (phase === "submitted") {
		return (
			<p className="text-sm text-muted-foreground">
				Kết quả:{" "}
				<strong className="text-foreground">
					{done}/{total}
				</strong>{" "}
				câu đã ghi âm
			</p>
		)
	}
	return (
		<p className="text-sm text-muted-foreground">
			Đã ghi âm{" "}
			<strong className="text-foreground">
				{done}/{total}
			</strong>{" "}
			câu
		</p>
	)
}

// ─── Footer: Nav pills ────────────────────────────────────────────

function SpeakingNavBar({
	total,
	markers,
	submitted,
	onChange,
}: {
	total: number
	markers: readonly boolean[]
	submitted: boolean
	onChange: (i: number) => void
}) {
	return (
		<div className="flex flex-wrap items-center gap-1.5">
			{Array.from({ length: total }, (_, i) => {
				const done = markers[i]
				let pillClass = "border-border bg-background text-muted-foreground hover:bg-accent"
				if (submitted) {
					pillClass = done
						? "border-success bg-success/10 text-success"
						: "border-destructive bg-destructive/10 text-destructive"
				} else if (done) {
					pillClass = "border-primary bg-primary text-primary-foreground"
				}
				return (
					<button
						key={i}
						type="button"
						onClick={() => onChange(i)}
						className={cn(
							"flex size-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
							pillClass,
						)}
						aria-label={`Câu ${i + 1}`}
					>
						{i + 1}
					</button>
				)
			})}
		</div>
	)
}

// ─── Footer: Submit action ─────────────────────────────────────────

function SpeakingSubmitAction({
	phase,
	canSubmit,
	onSubmit,
	onReset,
}: {
	phase: "practicing" | "submitted"
	canSubmit: boolean
	onSubmit: () => void
	onReset: () => void
}) {
	if (phase === "practicing") {
		return (
			<Button
				type="button"
				size="lg"
				className="rounded-xl px-8"
				onClick={onSubmit}
				disabled={!canSubmit}
			>
				Nộp bài
			</Button>
		)
	}
	return (
		<div className="flex gap-2">
			<Button type="button" variant="outline" onClick={onReset}>
				<RotateCcw className="size-4" />
				Làm lại
			</Button>
			<Button asChild>
				<Link to="/luyen-tap/ky-nang" search={{ skill: "noi", category: "", page: 1 }}>
					Về danh sách đề nói
				</Link>
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
		<div className="space-y-4 rounded-2xl bg-muted/50 p-5 shadow-sm">
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

			{/* Bản ghi */}
			{state.audioUrl && (
				<div className="rounded-xl bg-background p-4">
					<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Bản ghi của bạn
					</p>
					<audio src={state.audioUrl} controls className="h-9 w-full">
						<track kind="captions" />
					</audio>
				</div>
			)}

			{/* Câu tiếp */}
			{state.audioUrl && !isRecording && i < exercise.sentences.length - 1 && (
				<button
					type="button"
					onClick={() => session.setCurrentIndex(i + 1)}
					className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
				>
					Câu tiếp theo <ChevronRight className="size-4" />
				</button>
			)}
		</div>
	)
}
