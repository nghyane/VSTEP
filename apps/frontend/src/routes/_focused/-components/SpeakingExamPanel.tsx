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
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useReactMediaRecorder } from "react-media-recorder"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type {
	ExamSessionDetail,
	QuestionContent,
	SpeakingPart1Content,
	SpeakingPart2Content,
	SpeakingPart3Content,
	SubmissionAnswer,
} from "@/types/api"

// --- Type guards ---

function isPart1(c: QuestionContent): c is SpeakingPart1Content {
	return "topics" in c
}

function isPart2(c: QuestionContent): c is SpeakingPart2Content {
	return "situation" in c && "options" in c
}

function isPart3(c: QuestionContent): c is SpeakingPart3Content {
	return "centralIdea" in c
}

// --- Part labels ---

function getPartLabel(content: QuestionContent): string {
	if (isPart1(content)) return "Social Interaction"
	if (isPart2(content)) return "Solution Discussion"
	if (isPart3(content)) return "Topic Development"
	return "Speaking"
}

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

// --- Props ---

interface SpeakingExamPanelProps {
	questions: ExamSessionDetail["questions"]
	answers: Map<string, SubmissionAnswer>
	onUpdateSpeaking: (questionId: string, audioUrl: string, durationSeconds: number) => void
}

// --- Recorder per question ---

type RecorderPhase = "idle" | "preparing" | "recording" | "done"

function SpeakingRecorder({
	preparationSeconds,
	speakingSeconds,
	existingAudioUrl,
	onRecorded,
}: {
	preparationSeconds: number
	speakingSeconds: number
	existingAudioUrl: string | null
	onRecorded: (audioUrl: string, durationSeconds: number) => void
}) {
	const [phase, setPhase] = useState<RecorderPhase>(existingAudioUrl ? "done" : "idle")
	const [timer, setTimer] = useState(0)
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const recordStartRef = useRef(0)
	const onRecordedRef = useRef(onRecorded)
	onRecordedRef.current = onRecorded

	const {
		status,
		startRecording,
		stopRecording,
		mediaBlobUrl,
		clearBlobUrl,
	} = useReactMediaRecorder({
		audio: true,
		video: false,
		askPermissionOnMount: false,
		onStop: () => {
			setPhase("done")
		},
	})

	// Save answer when recording finishes (use ref to avoid re-trigger loop)
	useEffect(() => {
		if (phase === "done" && mediaBlobUrl) {
			const elapsed = Math.round((Date.now() - recordStartRef.current) / 1000)
			onRecordedRef.current(mediaBlobUrl, Math.max(1, elapsed))
		}
	}, [phase, mediaBlobUrl])

	// Preparation countdown → auto-start recording
	useEffect(() => {
		if (phase !== "preparing") return
		setTimer(preparationSeconds)

		timerRef.current = setInterval(() => {
			setTimer((t) => {
				if (t <= 1) {
					// Start recording
					setPhase("recording")
					recordStartRef.current = Date.now()
					startRecording()
					return speakingSeconds
				}
				return t - 1
			})
		}, 1000)

		return () => {
			if (timerRef.current) clearInterval(timerRef.current)
		}
	}, [phase, preparationSeconds, speakingSeconds, startRecording])

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
		if (preparationSeconds > 0) {
			setPhase("preparing")
		} else {
			setPhase("recording")
			recordStartRef.current = Date.now()
			startRecording()
		}
	}, [preparationSeconds, startRecording])

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
		const url = mediaBlobUrl ?? existingAudioUrl
		if (!audio || !url) return
		audio.src = url
		audio.onended = () => setPlayingBack(false)
		audio.play().catch(() => {})
		setPlayingBack(true)
	}, [mediaBlobUrl, existingAudioUrl])

	const isError = status === "permission_denied" || status === "no_specified_media_found"
	const audioUrl = mediaBlobUrl ?? existingAudioUrl
	const hasDoneRecording = phase === "done" && audioUrl

	return (
		<div className="space-y-3 rounded-xl border bg-muted/10 p-4">
			{/* Status bar */}
			<div
				className={cn(
					"flex h-14 items-center justify-center rounded-lg border",
					phase === "recording"
						? "border-destructive/30 bg-destructive/5"
						: phase === "preparing"
							? "border-amber-400/30 bg-amber-50 dark:bg-amber-950/20"
							: "bg-muted/30",
				)}
			>
				{phase === "idle" && (
					<span className="text-sm text-muted-foreground">
						Bấm "Bắt đầu" để chuẩn bị và ghi âm
					</span>
				)}
				{phase === "preparing" && (
					<div className="flex items-center gap-3">
						<span className="size-2 animate-pulse rounded-full bg-amber-500" />
						<span className="text-sm font-medium text-amber-700 dark:text-amber-400">
							Chuẩn bị... {formatTimer(timer)}
						</span>
					</div>
				)}
				{phase === "recording" && (
					<div className="flex items-center gap-3">
						<span className="size-2 animate-pulse rounded-full bg-destructive" />
						<span className="text-sm font-medium text-destructive">
							Đang ghi âm... {formatTimer(timer)}
						</span>
					</div>
				)}
				{phase === "done" && audioUrl && (
					<span className="text-sm text-muted-foreground">
						Đã ghi xong — bấm "Nghe lại" để kiểm tra
					</span>
				)}
			</div>

			{/* Action buttons */}
			<div className="flex flex-wrap items-center gap-2">
				{phase === "idle" && (
					<Button size="sm" onClick={handleStart}>
						<HugeiconsIcon icon={RecordIcon} className="size-4" />
						{preparationSeconds > 0
							? `Bắt đầu (chuẩn bị ${formatDuration(preparationSeconds)})`
							: "Bắt đầu ghi âm"}
					</Button>
				)}
				{phase === "recording" && (
					<Button size="sm" variant="destructive" onClick={handleStop}>
						<HugeiconsIcon icon={SquareIcon} className="size-3.5" />
						Dừng
					</Button>
				)}
				{phase === "preparing" && (
					<Button size="sm" variant="outline" disabled>
						<HugeiconsIcon icon={Mic01Icon} className="size-4 animate-pulse" />
						Đang chuẩn bị...
					</Button>
				)}
				{hasDoneRecording && (
					<>
						<Button size="sm" variant="outline" onClick={handlePlayback} disabled={playingBack}>
							<HugeiconsIcon icon={playingBack ? PauseIcon : VolumeHighIcon} className="size-4" />
							{playingBack ? "Đang phát..." : "Nghe lại"}
						</Button>
						<Button size="sm" variant="outline" onClick={handleRetry}>
							<HugeiconsIcon icon={RecordIcon} className="size-4 text-destructive" />
							Ghi lại
						</Button>
					</>
				)}
			</div>

			{isError && (
				<p className="text-xs text-destructive">
					Không thể truy cập microphone. Hãy cấp quyền trên trình duyệt.
				</p>
			)}
			{hasDoneRecording && (
				<p className="text-xs font-medium text-emerald-600">✓ Đã ghi âm xong</p>
			)}

			{/* biome-ignore lint/a11y/useMediaCaption: playback only */}
			<audio ref={playbackRef} className="hidden" />
		</div>
	)
}

// --- Part 1 recorder (no prep/speaking timer — free practice) ---

function Part1Recorder({
	existingAudioUrl,
	onRecorded,
}: {
	existingAudioUrl: string | null
	onRecorded: (audioUrl: string, durationSeconds: number) => void
}) {
	return (
		<SpeakingRecorder
			preparationSeconds={0}
			speakingSeconds={180}
			existingAudioUrl={existingAudioUrl}
			onRecorded={onRecorded}
		/>
	)
}

// --- Content renderers ---

function Part1Content({
	content,
	existingAudioUrl,
	onRecorded,
}: {
	content: SpeakingPart1Content
	existingAudioUrl: string | null
	onRecorded: (audioUrl: string, durationSeconds: number) => void
}) {
	return (
		<div className="space-y-6">
			{content.topics.map((topic, ti) => (
				<div key={`topic-${ti}`} className="space-y-3">
					<h4 className="font-semibold">{topic.name}</h4>
					<ul className="space-y-2 pl-1">
						{topic.questions.map((q, qi) => (
							<li
								key={`q-${ti}-${qi}`}
								className="flex gap-2 rounded-lg border border-border bg-background p-3 text-sm"
							>
								<span className="shrink-0 font-medium text-primary">{qi + 1}.</span>
								<span>{q}</span>
							</li>
						))}
					</ul>
				</div>
			))}

			<Part1Recorder
				existingAudioUrl={existingAudioUrl}
				onRecorded={onRecorded}
			/>
		</div>
	)
}

function Part2Content({
	content,
	existingAudioUrl,
	onRecorded,
}: {
	content: SpeakingPart2Content
	existingAudioUrl: string | null
	onRecorded: (audioUrl: string, durationSeconds: number) => void
}) {
	return (
		<div className="space-y-5">
			<div className="rounded-xl bg-muted/30 p-5">
				<p className="whitespace-pre-line leading-relaxed">{content.situation}</p>
			</div>

			<div className="space-y-2">
				<p className="text-sm font-medium">Các lựa chọn:</p>
				<div className="grid gap-2 sm:grid-cols-2">
					{content.options.map((opt, i) => (
						<div
							key={`opt-${i}`}
							className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2 text-sm"
						>
							<span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
								{i + 1}
							</span>
							<span>{opt}</span>
						</div>
					))}
				</div>
			</div>

			<div className="flex gap-4 text-xs text-muted-foreground">
				<span>Chuẩn bị: {formatDuration(content.preparationSeconds)}</span>
				<span>Nói: {formatDuration(content.speakingSeconds)}</span>
			</div>

			<SpeakingRecorder
				preparationSeconds={content.preparationSeconds}
				speakingSeconds={content.speakingSeconds}
				existingAudioUrl={existingAudioUrl}
				onRecorded={onRecorded}
			/>
		</div>
	)
}

function Part3Content({
	content,
	existingAudioUrl,
	onRecorded,
}: {
	content: SpeakingPart3Content
	existingAudioUrl: string | null
	onRecorded: (audioUrl: string, durationSeconds: number) => void
}) {
	return (
		<div className="space-y-5">
			<div className="rounded-xl bg-muted/30 p-5">
				<p className="whitespace-pre-line leading-relaxed">{content.centralIdea}</p>
			</div>

			{content.suggestions.length > 0 && (
				<div className="space-y-2">
					<p className="text-sm font-medium">Gợi ý:</p>
					<ul className="space-y-2">
						{content.suggestions.map((s, i) => (
							<li
								key={`sug-${i}`}
								className="flex gap-2 rounded-lg border border-border bg-background p-3 text-sm"
							>
								<span className="shrink-0 text-primary">•</span>
								<span>{s}</span>
							</li>
						))}
					</ul>
				</div>
			)}

			<div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
				<p className="text-sm font-medium text-primary">Câu hỏi tiếp theo:</p>
				<p className="mt-1 text-sm">{content.followUpQuestion}</p>
			</div>

			<div className="flex gap-4 text-xs text-muted-foreground">
				<span>Chuẩn bị: {formatDuration(content.preparationSeconds)}</span>
				<span>Nói: {formatDuration(content.speakingSeconds)}</span>
			</div>

			<SpeakingRecorder
				preparationSeconds={content.preparationSeconds}
				speakingSeconds={content.speakingSeconds}
				existingAudioUrl={existingAudioUrl}
				onRecorded={onRecorded}
			/>
		</div>
	)
}

// --- Main Panel ---

export function SpeakingExamPanel({ questions, answers, onUpdateSpeaking }: SpeakingExamPanelProps) {
	const parts = useMemo(() => [...questions].sort((a, b) => a.part - b.part), [questions])

	const [activePartIdx, setActivePartIdx] = useState(0)

	const activeQuestion = parts[activePartIdx]
	const content = activeQuestion?.content

	const handlePrevPart = useCallback(() => {
		setActivePartIdx((i) => Math.max(0, i - 1))
	}, [])

	const handleNextPart = useCallback(() => {
		setActivePartIdx((i) => Math.min(i + 1, parts.length - 1))
	}, [parts.length])

	// Get existing audio URL for the active question
	const getExistingAudioUrl = useCallback(
		(questionId: string): string | null => {
			const entry = answers.get(questionId)
			if (entry && "audioUrl" in entry) return entry.audioUrl
			return null
		},
		[answers],
	)

	const handleRecorded = useCallback(
		(questionId: string) => (audioUrl: string, durationSeconds: number) => {
			onUpdateSpeaking(questionId, audioUrl, durationSeconds)
		},
		[onUpdateSpeaking],
	)

	if (!activeQuestion || !content) return null

	const partLabel = getPartLabel(content)

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* ---- Content area (scrollable) ---- */}
			<div className="flex-1 overflow-y-auto">
				<div className="mx-auto max-w-3xl space-y-6 p-6">
					{/* Part header */}
					<div className="flex items-center gap-3">
						<HugeiconsIcon icon={Mic01Icon} className="size-5 text-primary" />
						<h3 className="text-lg font-semibold">Speaking — Part {activeQuestion.part}</h3>
						<span className="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
							{partLabel}
						</span>
					</div>

					{/* Part-specific content + recorder */}
					{isPart1(content) && (
						<Part1Content
							content={content}
							existingAudioUrl={getExistingAudioUrl(activeQuestion.id)}
							onRecorded={handleRecorded(activeQuestion.id)}
						/>
					)}
					{isPart2(content) && (
						<Part2Content
							content={content}
							existingAudioUrl={getExistingAudioUrl(activeQuestion.id)}
							onRecorded={handleRecorded(activeQuestion.id)}
						/>
					)}
					{isPart3(content) && (
						<Part3Content
							content={content}
							existingAudioUrl={getExistingAudioUrl(activeQuestion.id)}
							onRecorded={handleRecorded(activeQuestion.id)}
						/>
					)}
				</div>
			</div>

			{/* ---- Part tabs + prev/next buttons ---- */}
			<div className="flex items-center justify-between border-t bg-muted/5 px-4 py-2.5">
				{/* Left: prev part */}
				{activePartIdx > 0 ? (
					<Button size="sm" variant="outline" onClick={handlePrevPart}>
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						Part {activePartIdx}
					</Button>
				) : (
					<div className="w-24" />
				)}

				{/* Center: part tabs */}
				<div className="flex items-center gap-1.5">
					{parts.map((q, i) => {
						const isActive = i === activePartIdx
						const label = getPartLabel(q.content)
						const hasRecording = getExistingAudioUrl(q.id) != null
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
								{hasRecording && <span className="text-emerald-400">✓</span>}
								Part {i + 1}
								<span className="hidden opacity-80 sm:inline">· {label}</span>
							</button>
						)
					})}
				</div>

				{/* Right: next part */}
				{activePartIdx < parts.length - 1 ? (
					<Button size="sm" onClick={handleNextPart}>
						Part {activePartIdx + 2}
						<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
					</Button>
				) : (
					<div className="w-24" />
				)}
			</div>
		</div>
	)
}
