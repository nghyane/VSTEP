import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Loading03Icon,
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
import { useUploadSpeakingAudio } from "@/hooks/use-uploads"
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
	onUpdateSpeaking: (questionId: string, audioPath: string, durationSeconds: number) => void
}

// --- Detect supported audio mimeType ---

function getSupportedMimeType(): string | undefined {
	const candidates = ["audio/ogg;codecs=opus", "audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
	for (const mime of candidates) {
		if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) return mime
	}
	return undefined
}

// --- Recorder per question ---

type RecorderPhase = "idle" | "recording" | "stopping" | "done"

function SpeakingRecorder({
	speakingSeconds,
	hasExistingRecording,
	onRecorded,
}: {
	speakingSeconds: number
	hasExistingRecording: boolean
	onRecorded: (audioPath: string, durationSeconds: number) => void
}) {
	const [phase, setPhase] = useState<RecorderPhase>(hasExistingRecording ? "done" : "idle")
	const [timer, setTimer] = useState(0)
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const recordStartRef = useRef(0)
	const onRecordedRef = useRef(onRecorded)
	onRecordedRef.current = onRecorded

	const uploadAudio = useUploadSpeakingAudio()
	const uploadAudioRef = useRef(uploadAudio)
	uploadAudioRef.current = uploadAudio
	const [uploading, setUploading] = useState(false)
	const uploadingRef = useRef(false)
	const [uploadError, setUploadError] = useState<string | null>(null)

	const mimeType = useMemo(() => getSupportedMimeType(), [])

	const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } =
		useReactMediaRecorder({
			audio: true,
			video: false,
			mediaRecorderOptions: mimeType ? { mimeType } : undefined,
			askPermissionOnMount: false,
			onStop: () => {
				// Only source of truth for phase → "done"
				setPhase("done")
			},
		})

	const stopRecordingRef = useRef(stopRecording)
	stopRecordingRef.current = stopRecording

	// Upload to R2 when recording finishes and blob is ready
	// Uses refs to avoid re-triggering on mutation object identity changes
	useEffect(() => {
		if (phase !== "done" || !mediaBlobUrl) return
		if (uploadingRef.current || uploadAudioRef.current.isSuccess) return

		const elapsed = Math.round((Date.now() - recordStartRef.current) / 1000)
		const duration = Math.max(1, elapsed)

		uploadingRef.current = true
		setUploading(true)
		setUploadError(null)

		uploadAudioRef.current.mutate(mediaBlobUrl, {
			onSuccess: (audioPath) => {
				onRecordedRef.current(audioPath, duration)
				uploadingRef.current = false
				setUploading(false)
			},
			onError: (err) => {
				setUploadError(err instanceof Error ? err.message : "Upload thất bại")
				uploadingRef.current = false
				setUploading(false)
			},
		})
	}, [phase, mediaBlobUrl])

	// Recording countdown → auto-stop
	useEffect(() => {
		if (phase !== "recording") return

		setTimer(speakingSeconds)
		if (timerRef.current) clearInterval(timerRef.current)

		timerRef.current = setInterval(() => {
			setTimer((t) => {
				if (t <= 1) {
					stopRecordingRef.current()
					return 0
				}
				return t - 1
			})
		}, 1000)

		return () => {
			if (timerRef.current) clearInterval(timerRef.current)
		}
	}, [phase, speakingSeconds])

	const handleStart = useCallback(() => {
		setPhase("recording")
		setUploadError(null)
		recordStartRef.current = Date.now()
		startRecording()
	}, [startRecording])

	const handleStop = useCallback(() => {
		if (timerRef.current) clearInterval(timerRef.current)
		stopRecording()
		// Don't setPhase("done") here — wait for onStop callback
		// which fires after mediaBlobUrl is ready
		setPhase("stopping")
	}, [stopRecording])

	const handleRetry = useCallback(() => {
		clearBlobUrl()
		uploadAudio.reset()
		uploadingRef.current = false
		setPhase("idle")
		setTimer(0)
		setUploading(false)
		setUploadError(null)
	}, [clearBlobUrl, uploadAudio])

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
	const hasDoneRecording =
		phase === "done" && (mediaBlobUrl || uploadAudio.isSuccess || hasExistingRecording)
	const isUploaded = uploadAudio.isSuccess || hasExistingRecording

	return (
		<div className="space-y-3 rounded-xl border bg-muted/10 p-4">
			{/* Status bar */}
			<div
				className={cn(
					"flex h-14 items-center justify-center rounded-lg border",
					phase === "recording"
						? "border-destructive/30 bg-destructive/5"
						: uploading || phase === "stopping"
							? "border-primary/30 bg-primary/5"
							: "bg-muted/30",
				)}
			>
				{phase === "idle" && (
					<span className="text-sm text-muted-foreground">Bấm "Bắt đầu" để ghi âm</span>
				)}

				{phase === "recording" && (
					<div className="flex items-center gap-3">
						<span className="size-2 animate-pulse rounded-full bg-destructive" />
						<span className="text-sm font-medium text-destructive">
							Đang ghi âm... {formatTimer(timer)}
						</span>
					</div>
				)}

				{phase === "stopping" && (
					<div className="flex items-center gap-2">
						<HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin text-primary" />
						<span className="text-sm text-primary">Đang xử lý...</span>
					</div>
				)}

				{phase === "done" && uploading && (
					<div className="flex items-center gap-2">
						<HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin text-primary" />
						<span className="text-sm text-primary">Đang tải lên...</span>
					</div>
				)}

				{phase === "done" && !uploading && isUploaded && (
					<span className="text-sm text-muted-foreground">
						Đã ghi xong — bấm "Nghe lại" để kiểm tra
					</span>
				)}

				{phase === "done" && !uploading && !isUploaded && !uploadError && mediaBlobUrl && (
					<span className="text-sm text-muted-foreground">Đang xử lý...</span>
				)}
			</div>

			{/* Action buttons */}
			<div className="flex flex-wrap items-center justify-center gap-2">
				{phase === "idle" && (
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

				{hasDoneRecording && !uploading && (
					<>
						{mediaBlobUrl && (
							<Button size="sm" variant="outline" onClick={handlePlayback} disabled={playingBack}>
								<HugeiconsIcon icon={playingBack ? PauseIcon : VolumeHighIcon} className="size-4" />
								{playingBack ? "Đang phát..." : "Nghe lại"}
							</Button>
						)}
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
			{uploadError && <p className="text-xs text-destructive">Lỗi tải lên: {uploadError}</p>}
			{isUploaded && !uploading && (
				<p className="text-xs font-medium text-emerald-600">✓ Đã ghi âm và tải lên thành công</p>
			)}

			{/* biome-ignore lint/a11y/useMediaCaption: playback only */}
			<audio ref={playbackRef} className="hidden" />
		</div>
	)
}

// --- Part 1 recorder (no prep/speaking timer — free practice) ---

function Part1Recorder({
	hasExistingRecording,
	onRecorded,
}: {
	hasExistingRecording: boolean
	onRecorded: (audioUrl: string, durationSeconds: number) => void
}) {
	return (
		<SpeakingRecorder
			speakingSeconds={180}
			hasExistingRecording={hasExistingRecording}
			onRecorded={onRecorded}
		/>
	)
}

// --- Content renderers ---

function Part1Content({
	content,
	hasExistingRecording,
	onRecorded,
}: {
	content: SpeakingPart1Content
	hasExistingRecording: boolean
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

			<Part1Recorder hasExistingRecording={hasExistingRecording} onRecorded={onRecorded} />
		</div>
	)
}

function Part2Content({
	content,
	hasExistingRecording,
	onRecorded,
}: {
	content: SpeakingPart2Content
	hasExistingRecording: boolean
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
				<span>Nói: {formatDuration(content.speakingSeconds)}</span>
			</div>

			<SpeakingRecorder
				speakingSeconds={content.speakingSeconds}
				hasExistingRecording={hasExistingRecording}
				onRecorded={onRecorded}
			/>
		</div>
	)
}

function Part3Content({
	content,
	hasExistingRecording,
	onRecorded,
}: {
	content: SpeakingPart3Content
	hasExistingRecording: boolean
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
				<span>Nói: {formatDuration(content.speakingSeconds)}</span>
			</div>

			<SpeakingRecorder
				speakingSeconds={content.speakingSeconds}
				hasExistingRecording={hasExistingRecording}
				onRecorded={onRecorded}
			/>
		</div>
	)
}

// --- Main Panel ---

export function SpeakingExamPanel({
	questions,
	answers,
	onUpdateSpeaking,
}: SpeakingExamPanelProps) {
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

	const hasExistingRecording = useCallback(
		(questionId: string): boolean => {
			const entry = answers.get(questionId)
			return entry != null && "audioPath" in entry
		},
		[answers],
	)

	const handleRecorded = useCallback(
		(questionId: string) => (audioPath: string, durationSeconds: number) => {
			onUpdateSpeaking(questionId, audioPath, durationSeconds)
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
							hasExistingRecording={hasExistingRecording(activeQuestion.id)}
							onRecorded={handleRecorded(activeQuestion.id)}
						/>
					)}
					{isPart2(content) && (
						<Part2Content
							content={content}
							hasExistingRecording={hasExistingRecording(activeQuestion.id)}
							onRecorded={handleRecorded(activeQuestion.id)}
						/>
					)}
					{isPart3(content) && (
						<Part3Content
							content={content}
							hasExistingRecording={hasExistingRecording(activeQuestion.id)}
							onRecorded={handleRecorded(activeQuestion.id)}
						/>
					)}
				</div>
			</div>

			{/* ---- Part tabs + prev/next buttons ---- */}
			{parts.length > 1 && (
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

				{/* Center: part tabs (scrollable when many parts) */}
				<div className="flex min-w-0 flex-1 items-center justify-center overflow-x-auto px-2">
					<div className="flex items-center gap-1.5">
						{parts.map((q, i) => {
							const isActive = i === activePartIdx
							const entry = answers.get(q.id)
							const hasRecording = entry != null && "audioPath" in entry
							return (
								<button
									key={i}
									type="button"
									onClick={() => setActivePartIdx(i)}
									className={cn(
										"flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
										isActive
											? "bg-primary text-primary-foreground"
											: "bg-muted text-muted-foreground hover:bg-muted/80",
									)}
								>
									{hasRecording && <span className="text-emerald-400">✓</span>}
									{i + 1}
								</button>
							)
						})}
					</div>
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
			)}
		</div>
	)
}
