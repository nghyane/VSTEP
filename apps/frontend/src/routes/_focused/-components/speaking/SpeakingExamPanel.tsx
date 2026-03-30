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

// --- Recorder per question ---

type RecorderPhase = "idle" | "recording" | "done"

function SpeakingRecorder({
	speakingSeconds,
	existingAudioUrl,
	onRecorded,
}: {
	speakingSeconds: number
	existingAudioUrl: string | null
	onRecorded: (audioPath: string, durationSeconds: number) => void
}) {
	const [phase, setPhase] = useState<RecorderPhase>(existingAudioUrl ? "done" : "idle")
	const [timer, setTimer] = useState(0)
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const recordStartRef = useRef(0)
	const onRecordedRef = useRef(onRecorded)
	onRecordedRef.current = onRecorded

	const uploadAudio = useUploadSpeakingAudio()
	const [uploading, setUploading] = useState(false)
	const [uploadError, setUploadError] = useState<string | null>(null)

	const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } =
		useReactMediaRecorder({
			audio: true,
			video: false,
			mediaRecorderOptions: { mimeType: "audio/ogg;codecs=opus" },
			askPermissionOnMount: false,
			onStop: () => {
				setPhase("done")
			},
		})

	// Upload to R2 when recording finishes
	useEffect(() => {
		if (phase !== "done" || !mediaBlobUrl || uploading || uploadAudio.isSuccess) return

		const elapsed = Math.round((Date.now() - recordStartRef.current) / 1000)
		const duration = Math.max(1, elapsed)

		setUploading(true)
		setUploadError(null)

		uploadAudio.mutate(mediaBlobUrl, {
			onSuccess: (audioPath) => {
				onRecordedRef.current(audioPath, duration)
				setUploading(false)
			},
			onError: (err) => {
				setUploadError(err instanceof Error ? err.message : "Upload thất bại")
				setUploading(false)
			},
		})
	}, [phase, mediaBlobUrl, uploading, uploadAudio])

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
		setUploadError(null)
		recordStartRef.current = Date.now()
		startRecording()
	}, [startRecording])

	const handleStop = useCallback(() => {
		if (timerRef.current) clearInterval(timerRef.current)
		stopRecording()
		setPhase("done")
	}, [stopRecording])

	const handleRetry = useCallback(() => {
		clearBlobUrl()
		uploadAudio.reset()
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
		const url = mediaBlobUrl ?? existingAudioUrl
		if (!audio || !url) return
		audio.src = url
		audio.onended = () => setPlayingBack(false)
		audio.play().catch(() => {})
		setPlayingBack(true)
	}, [mediaBlobUrl, existingAudioUrl])

	const isError = status === "permission_denied" || status === "no_specified_media_found"
	const localAudio = mediaBlobUrl ?? existingAudioUrl
	const hasDoneRecording = phase === "done" && (localAudio || uploadAudio.isSuccess)
	const isUploaded = uploadAudio.isSuccess

	return (
		<div className="space-y-3 rounded-xl border bg-muted/10 p-4">
			{/* Status bar */}
			<div
				className={cn(
					"flex h-14 items-center justify-center rounded-lg border",
					phase === "recording"
						? "border-destructive/30 bg-destructive/5"
						: uploading
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

				{phase === "done" && !uploading && !isUploaded && !uploadError && localAudio && (
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
						{localAudio && (
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
	existingAudioUrl,
	onRecorded,
}: {
	existingAudioUrl: string | null
	onRecorded: (audioUrl: string, durationSeconds: number) => void
}) {
	return (
		<SpeakingRecorder
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

			<Part1Recorder existingAudioUrl={existingAudioUrl} onRecorded={onRecorded} />
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
				<span>Nói: {formatDuration(content.speakingSeconds)}</span>
			</div>

			<SpeakingRecorder
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
				<span>Nói: {formatDuration(content.speakingSeconds)}</span>
			</div>

			<SpeakingRecorder
				speakingSeconds={content.speakingSeconds}
				existingAudioUrl={existingAudioUrl}
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

	// Get existing audio blob URL for playback (local blob only)
	const getExistingAudioUrl = useCallback((_questionId: string): string | null => {
		// After upload, we only store audioPath (R2 path), not blob URL
		// Playback of previously uploaded audio would require presigned read URL
		// For now, playback only works for current session's recordings via mediaBlobUrl
		return null
	}, [])

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
		</div>
	)
}
