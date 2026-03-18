import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Mic01Icon,
	PauseIcon,
	RecordIcon,
	SquareIcon,
	VolumeHighIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useReactMediaRecorder } from "react-media-recorder"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SpeakingFeedback } from "@/routes/_focused/-components/speaking/SpeakingFeedback"
import type { SpeakingExam } from "@/routes/_learner/practice/-components/mock-data"

// --- Utilities ---

function formatDuration(seconds: number): string {
	if (seconds < 60) return `${seconds}s`
	const m = Math.floor(seconds / 60)
	const s = seconds % 60
	return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function formatTimer(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = seconds % 60
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

// --- Recorder (mirrors SpeakingExamPanel's SpeakingRecorder) ---

type RecorderPhase = "idle" | "recording" | "done"

function ExerciseRecorder({
	speakingSeconds,
	disabled,
}: {
	speakingSeconds: number
	disabled?: boolean
}) {
	const [phase, setPhase] = useState<RecorderPhase>("idle")
	const [timer, setTimer] = useState(0)
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

	const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } =
		useReactMediaRecorder({
			audio: true,
			video: false,
			askPermissionOnMount: false,
			onStop: () => {
				setPhase("done")
			},
		})

	// Recording countdown → auto-stop
	useEffect(() => {
		if (phase !== "recording") return

		setTimer(speakingSeconds)
		if (timerRef.current) clearInterval(timerRef.current)

		timerRef.current = setInterval(() => {
			setTimer((t) => {
				if (t <= 1) {
					stopRecording()
					return 0
				}
				return t - 1
			})
		}, 1000)

		return () => {
			if (timerRef.current) clearInterval(timerRef.current)
		}
	}, [phase, speakingSeconds, stopRecording])

	const handleStart = useCallback(() => {
		setPhase("recording")
		startRecording()
	}, [startRecording])

	const handleStop = useCallback(() => {
		if (timerRef.current) clearInterval(timerRef.current)
		stopRecording()
		setPhase("done")
	}, [stopRecording])

	const handleRetry = useCallback(() => {
		clearBlobUrl()
		setPhase("idle")
		setTimer(0)
	}, [clearBlobUrl])

	// Playback
	const playbackRef = useRef<HTMLAudioElement>(null)
	const [playingBack, setPlayingBack] = useState(false)

	const handlePlayback = useCallback(() => {
		const audio = playbackRef.current
		if (!audio || !mediaBlobUrl) return
		audio.src = mediaBlobUrl
		audio.onended = () => setPlayingBack(false)
		audio.play().catch(() => {})
		setPlayingBack(true)
	}, [mediaBlobUrl])

	const isError = status === "permission_denied" || status === "no_specified_media_found"
	const hasDoneRecording = phase === "done" && mediaBlobUrl

	return (
		<div className="space-y-3 rounded-xl border bg-muted/10 p-4">
			{/* Status bar */}
			<div
				className={cn(
					"flex h-14 items-center justify-center rounded-lg border",
					phase === "recording" ? "border-destructive/30 bg-destructive/5" : "bg-muted/30",
				)}
			>
				{phase === "idle" && (
					<span className="text-sm text-muted-foreground">
						{disabled ? "Đã nộp bài — không thể ghi âm" : 'Bấm "Bắt đầu" để ghi âm'}
					</span>
				)}

				{phase === "recording" && (
					<div className="flex items-center gap-3">
						<span className="size-2 animate-pulse rounded-full bg-destructive" />
						<span className="text-sm font-medium text-destructive">
							Đang ghi âm... {formatTimer(timer)}
						</span>
					</div>
				)}
				{phase === "done" && mediaBlobUrl && (
					<span className="text-sm text-muted-foreground">
						Đã ghi xong — bấm "Nghe lại" để kiểm tra
					</span>
				)}
			</div>

			{/* Action buttons */}
			<div className="flex flex-wrap items-center justify-center gap-2">
				{phase === "idle" && !disabled && (
					<Button size="sm" onClick={handleStart}>
						<HugeiconsIcon icon={RecordIcon} className="size-4" />
						Bắt đầu ghi âm
					</Button>
				)}
				{phase === "recording" && (
					<Button size="sm" variant="destructive" onClick={handleStop}>
						<HugeiconsIcon icon={SquareIcon} className="size-3.5" />
						Dừng
					</Button>
				)}

				{hasDoneRecording && (
					<>
						<Button size="sm" variant="outline" onClick={handlePlayback} disabled={playingBack}>
							<HugeiconsIcon icon={playingBack ? PauseIcon : VolumeHighIcon} className="size-4" />
							{playingBack ? "Đang phát..." : "Nghe lại"}
						</Button>
						{!disabled && (
							<Button size="sm" variant="outline" onClick={handleRetry}>
								<HugeiconsIcon icon={RecordIcon} className="size-4 text-destructive" />
								Ghi lại
							</Button>
						)}
					</>
				)}
			</div>

			{isError && (
				<p className="text-xs text-destructive">
					Không thể truy cập microphone. Hãy cấp quyền trên trình duyệt.
				</p>
			)}
			{hasDoneRecording && <p className="text-xs font-medium text-emerald-600">✓ Đã ghi âm xong</p>}

			{/* biome-ignore lint/a11y/useMediaCaption: playback only */}
			<audio ref={playbackRef} className="hidden" />
		</div>
	)
}

// --- Part Content ---

function PartContent({
	part,
	disabled,
}: {
	part: SpeakingExam["parts"][number]
	disabled?: boolean
}) {
	return (
		<div className="space-y-5">
			<div className="rounded-xl bg-muted/30 p-5">
				<p className="whitespace-pre-line leading-relaxed">{part.instructions}</p>
			</div>

			<div className="flex gap-4 text-xs text-muted-foreground">
				<span>Nói: {formatDuration(part.speakingTime * 60)}</span>
			</div>

			<ExerciseRecorder speakingSeconds={part.speakingTime * 60} disabled={disabled} />
		</div>
	)
}

// --- Main Component ---

export function SpeakingExerciseSection({
	exam,
	submitted,
}: {
	exam: SpeakingExam
	submitted: boolean
}) {
	const [activePartIdx, setActivePartIdx] = useState(0)
	const activePart = exam.parts[activePartIdx]

	const handlePrevPart = useCallback(() => {
		setActivePartIdx((i) => Math.max(0, i - 1))
	}, [])

	const handleNextPart = useCallback(() => {
		setActivePartIdx((i) => Math.min(i + 1, exam.parts.length - 1))
	}, [exam.parts.length])

	return (
		<div className="flex flex-1 overflow-hidden">
			{/* Left — exercise content */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Scrollable content */}
				<div className="flex-1 overflow-y-auto">
					<div className="mx-auto max-w-3xl space-y-6 p-6">
						{/* Part header */}
						<div className="flex items-center gap-3">
							<HugeiconsIcon icon={Mic01Icon} className="size-5 text-primary" />
							<h3 className="text-lg font-semibold">Speaking — Part {activePart.partNumber}</h3>
							{activePart.title && (
								<span className="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
									{activePart.title}
								</span>
							)}
						</div>

						{/* Part content + recorder */}
						<PartContent key={activePartIdx} part={activePart} disabled={submitted} />
					</div>
				</div>

				{/* Part tabs + prev/next (only when multiple parts) */}
				{exam.parts.length > 1 && (
					<div className="flex items-center justify-between border-t bg-muted/5 px-4 py-2.5">
						{activePartIdx > 0 ? (
							<Button size="sm" variant="outline" onClick={handlePrevPart}>
								<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
								Part {activePartIdx}
							</Button>
						) : (
							<div className="w-24" />
						)}

						<div className="flex items-center gap-1.5">
							{exam.parts.map((p, i) => {
								const isActive = i === activePartIdx
								return (
									<button
										key={i}
										type="button"
										onClick={() => setActivePartIdx(i)}
										className={cn(
											"flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
											isActive
												? "bg-primary text-primary-foreground"
												: "bg-muted text-muted-foreground hover:bg-muted/80",
										)}
									>
										Part {p.partNumber}
										{p.title && <span className="hidden opacity-80 sm:inline">· {p.title}</span>}
									</button>
								)
							})}
						</div>

						{activePartIdx < exam.parts.length - 1 ? (
							<Button size="sm" onClick={handleNextPart}>
								Part {activePartIdx + 2}
								<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
							</Button>
						) : (
							<div className="w-24" />
						)}
					</div>
				)}
			</div>

			{/* Right — AI tools sidebar (after submit) */}
			{submitted && (
				<aside className="hidden w-[380px] shrink-0 overflow-y-auto border-l lg:block">
					<div className="p-5">
						<SpeakingFeedback />
					</div>
				</aside>
			)}
		</div>
	)
}
