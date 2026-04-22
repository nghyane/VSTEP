import { useCallback, useEffect, useRef, useState } from "react"
import { Icon } from "#/components/Icon"
import { useVoiceRecorder } from "#/features/practice/use-voice-recorder"
import { cn } from "#/lib/utils"

const TEST_AUDIO_URL =
	"https://luyenthivstep.vn/assets/nhch/listening/bac3/lp1-1642953803_eb7ab6f2e8dead6de076.mp3"

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = Math.floor(seconds % 60)
	return `${m}:${String(s).padStart(2, "0")}`
}

// ─── AudioTestPlayer ─────────────────────────────────────────────────────────

export function AudioTestPlayer() {
	const audioRef = useRef<HTMLAudioElement>(null)
	const [playing, setPlaying] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const [passed, setPassed] = useState(false)

	const handleToggle = useCallback(() => {
		const audio = audioRef.current
		if (!audio) return
		if (playing) {
			audio.pause()
			setPlaying(false)
		} else {
			audio.play().catch(() => null)
			setPlaying(true)
			setPassed(true)
		}
	}, [playing])

	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return
		const onTime = () => {
			setCurrentTime(audio.currentTime)
			if (audio.duration && Number.isFinite(audio.duration)) setDuration(audio.duration)
		}
		const onEnded = () => setPlaying(false)
		const onMeta = () => {
			if (audio.duration && Number.isFinite(audio.duration)) setDuration(audio.duration)
		}
		audio.addEventListener("timeupdate", onTime)
		audio.addEventListener("ended", onEnded)
		audio.addEventListener("loadedmetadata", onMeta)
		return () => {
			audio.removeEventListener("timeupdate", onTime)
			audio.removeEventListener("ended", onEnded)
			audio.removeEventListener("loadedmetadata", onMeta)
		}
	}, [])

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0

	return (
		<div className="space-y-2">
			<div className="card flex items-center gap-3 px-4 py-3">
				<button
					type="button"
					onClick={handleToggle}
					aria-label={playing ? "Tạm dừng" : "Phát"}
					className="btn btn-primary flex size-8 shrink-0 items-center justify-center rounded-full p-0"
				>
					{playing ? (
						<Icon name="timer" size="xs" className="text-white" />
					) : (
						<Icon name="volume" size="xs" className="text-white" />
					)}
				</button>

				<span className="font-mono text-xs tabular-nums text-muted">
					{formatTime(currentTime)} / {formatTime(duration)}
				</span>

				<div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-background">
					<div
						className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-200"
						style={{ width: `${progress}%` }}
					/>
				</div>

				<Icon name="volume" size="xs" className="shrink-0 text-subtle" />
			</div>

			{passed && (
				<p className="flex items-center gap-1.5 text-xs font-bold text-success">
					<Icon name="check" size="xs" />
					Âm thanh hoạt động tốt
				</p>
			)}

			<audio ref={audioRef} src={TEST_AUDIO_URL} preload="metadata" className="hidden" />
		</div>
	)
}

// ─── MicTest ─────────────────────────────────────────────────────────────────

export function MicTest() {
	const recorder = useVoiceRecorder(5)
	const isRecording = recorder.state === "recording"

	const handleRecord = useCallback(() => {
		if (isRecording) recorder.stop()
		else void recorder.start()
	}, [isRecording, recorder])

	return (
		<div className="space-y-3">
			<div
				className={cn(
					"flex h-12 items-center justify-center rounded-[--radius-card] border-2 border-border bg-background transition-colors",
					isRecording && "border-destructive/40 bg-destructive-tint",
				)}
			>
				{recorder.state !== "recording" && recorder.audioUrl === null && (
					<span className="text-xs text-subtle">Đặt mic sát miệng rồi bấm "Thu âm"</span>
				)}
				{isRecording && (
					<div className="flex items-center gap-2">
						<span className="size-2 animate-pulse rounded-full bg-destructive" />
						<span className="text-xs font-bold text-destructive">
							Đang thu âm... {Math.round(recorder.elapsedMs / 1000)}s
						</span>
					</div>
				)}
				{!isRecording && recorder.audioUrl !== null && (
					<div className="flex items-center gap-1.5 text-success">
						<Icon name="check" size="xs" />
						<span className="text-xs font-bold">Đã thu xong — microphone hoạt động</span>
					</div>
				)}
			</div>

			<div className="flex flex-wrap items-center justify-center gap-2">
				{!isRecording && (
					<button
						type="button"
						onClick={handleRecord}
						className="btn btn-destructive flex items-center gap-2 text-xs"
					>
						<Icon name="mic" size="xs" className="text-white" />
						{recorder.audioUrl ? "Thu lại" : "Thu âm"}
					</button>
				)}
				{isRecording && (
					<button
						type="button"
						onClick={handleRecord}
						className="btn btn-secondary flex items-center gap-2 text-xs"
					>
						<span className="size-2 rounded-sm bg-foreground" />
						Dừng
					</button>
				)}
			</div>

			{recorder.error && <p className="text-xs font-bold text-destructive">{recorder.error}</p>}

			{recorder.audioUrl && (
				<div className="card space-y-2 p-3">
					<p className="text-xs font-bold text-muted">Nghe lại bản ghi của bạn</p>
					<audio src={recorder.audioUrl} controls className="h-9 w-full" />
				</div>
			)}

			{recorder.audioUrl && (
				<p className="flex items-center gap-1.5 text-xs font-bold text-success">
					<Icon name="check" size="xs" />
					Microphone hoạt động tốt
				</p>
			)}
		</div>
	)
}
