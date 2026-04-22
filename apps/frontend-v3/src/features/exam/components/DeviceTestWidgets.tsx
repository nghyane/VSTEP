import { useCallback, useEffect, useRef, useState } from "react"
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
			<div className="card flex items-center gap-3 px-3 py-2">
				<button
					type="button"
					onClick={handleToggle}
					className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity hover:opacity-90 active:scale-95"
					aria-label={playing ? "Tạm dừng" : "Phát"}
				>
					{playing ? (
						<svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
							<rect x="4" y="3" width="3" height="10" rx="1" />
							<rect x="9" y="3" width="3" height="10" rx="1" />
						</svg>
					) : (
						<svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
							<path d="M5 3l8 5-8 5V3z" />
						</svg>
					)}
				</button>
				<span className="font-mono text-xs tabular-nums text-muted">
					{formatTime(currentTime)} / {formatTime(duration)}
				</span>
				<div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
					<div
						className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-200"
						style={{ width: `${progress}%` }}
					/>
				</div>
				<svg
					viewBox="0 0 16 16"
					className="size-4 text-muted"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="M7 3L4 6H2v4h2l3 3V3z" />
					<path d="M11 5a4 4 0 010 6M13 3a7 7 0 010 10" />
				</svg>
			</div>
			{passed && <p className="text-xs font-medium text-success">✓ Âm thanh hoạt động tốt</p>}
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
					"flex h-12 items-center justify-center rounded-xl border-2 border-border bg-surface transition-colors",
					isRecording && "border-destructive/30 bg-destructive/5",
				)}
			>
				{recorder.state !== "recording" && recorder.audioUrl === null && (
					<span className="text-xs text-muted">Đặt mic sát miệng rồi bấm "Thu âm"</span>
				)}
				{isRecording && (
					<div className="flex items-center gap-2">
						<span className="size-2 animate-pulse rounded-full bg-destructive" />
						<span className="text-xs font-medium text-destructive">
							Đang thu âm... {Math.round(recorder.elapsedMs / 1000)}s
						</span>
					</div>
				)}
				{!isRecording && recorder.audioUrl !== null && (
					<span className="text-xs text-muted">Đã thu xong — microphone hoạt động</span>
				)}
			</div>

			<div className="flex flex-wrap items-center justify-center gap-2">
				{!isRecording && (
					<button
						type="button"
						onClick={handleRecord}
						className="flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
					>
						<svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
							<rect x="6" y="2" width="4" height="8" rx="2" />
							<path
								d="M4 8a4 4 0 008 0M8 12v2"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
							/>
						</svg>
						{recorder.audioUrl ? "Thu lại" : "Thu âm"}
					</button>
				)}
				{isRecording && (
					<button
						type="button"
						onClick={handleRecord}
						className="flex items-center gap-2 rounded-xl border-2 border-border px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-surface"
					>
						<svg viewBox="0 0 12 12" className="size-3" fill="currentColor" aria-hidden="true">
							<rect x="2" y="2" width="8" height="8" rx="1" />
						</svg>
						Dừng
					</button>
				)}
			</div>

			{recorder.error && <p className="text-xs text-destructive">{recorder.error}</p>}

			{recorder.audioUrl && (
				<div className="card space-y-2 p-3">
					<p className="text-xs font-medium text-muted">Nghe lại bản ghi của bạn</p>
					<audio src={recorder.audioUrl} controls className="h-9 w-full" />
				</div>
			)}

			{recorder.audioUrl && <p className="text-xs font-medium text-success">✓ Microphone hoạt động tốt</p>}
		</div>
	)
}
