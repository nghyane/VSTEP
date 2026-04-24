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
		<div className="space-y-3">
			<div
				className={cn(
					"flex items-center gap-4 rounded-(--radius-card) border-2 border-b-4 bg-surface px-4 py-3 transition-colors",
					passed ? "border-skill-listening/40 border-b-skill-listening/60" : "border-border",
				)}
			>
				<button
					type="button"
					onClick={handleToggle}
					aria-label={playing ? "Tạm dừng" : "Phát"}
					className={cn(
						"relative flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-b-4 text-white transition-all active:translate-y-[2px] active:border-b-2",
						"border-skill-listening-dark bg-skill-listening hover:brightness-110",
					)}
				>
					{!passed && <span className="absolute inset-0 animate-ping rounded-full bg-skill-listening/40" />}
					<Icon name={playing ? "timer" : "volume"} size="sm" className="relative text-white" />
				</button>

				<div className="flex min-w-0 flex-1 flex-col gap-1.5">
					<div className="flex items-center justify-between">
						<span className="text-xs font-extrabold text-foreground">
							{playing ? "Đang phát" : passed ? "Đã kiểm tra" : "Bấm để phát thử"}
						</span>
						<span className="font-mono text-[11px] tabular-nums text-muted">
							{formatTime(currentTime)} / {formatTime(duration)}
						</span>
					</div>
					<div className="relative h-2 w-full overflow-hidden rounded-full bg-border/60">
						<div
							className="absolute inset-y-0 left-0 rounded-full bg-skill-listening transition-[width] duration-200"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			</div>

			{passed && (
				<div className="flex items-center gap-2 rounded-full border-2 border-success/30 bg-success/10 px-3 py-1.5 text-xs font-extrabold text-success">
					<Icon name="check" size="xs" />
					Âm thanh hoạt động tốt
				</div>
			)}

			<audio ref={audioRef} src={TEST_AUDIO_URL} preload="metadata" className="hidden" />
		</div>
	)
}

// ─── MicTest ─────────────────────────────────────────────────────────────────

export function MicTest() {
	const recorder = useVoiceRecorder(5)
	const isRecording = recorder.state === "recording"
	const isDone = !isRecording && recorder.audioUrl !== null

	const handleRecord = useCallback(() => {
		if (isRecording) recorder.stop()
		else void recorder.start()
	}, [isRecording, recorder])

	return (
		<div className="space-y-3">
			<div
				className={cn(
					"flex min-h-16 items-center justify-center rounded-(--radius-card) border-2 border-b-4 px-4 py-3 transition-colors",
					isRecording && "border-destructive/40 border-b-destructive/60 bg-destructive-tint",
					isDone && "border-success/40 border-b-success/60 bg-success/5",
					!isRecording && !isDone && "border-border bg-surface",
				)}
			>
				{!isRecording && recorder.audioUrl === null && (
					<div className="flex items-center gap-2 text-subtle">
						<Icon name="mic" size="sm" className="text-skill-speaking" />
						<span className="text-xs font-semibold">Đặt mic sát miệng rồi bấm "Thu âm"</span>
					</div>
				)}
				{isRecording && (
					<div className="flex items-center gap-3">
						<span className="relative flex size-3 items-center justify-center">
							<span className="absolute inset-0 animate-ping rounded-full bg-destructive/50" />
							<span className="relative size-2.5 rounded-full bg-destructive" />
						</span>
						<span className="text-sm font-extrabold text-destructive tabular-nums">
							Đang thu âm… {Math.round(recorder.elapsedMs / 1000)}s
						</span>
					</div>
				)}
				{isDone && (
					<div className="flex items-center gap-2 text-success">
						<Icon name="check" size="sm" />
						<span className="text-xs font-extrabold">Đã thu xong — microphone hoạt động</span>
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
						{recorder.audioUrl ? "Thu lại" : "Thu âm thử"}
					</button>
				)}
				{isRecording && (
					<button type="button" onClick={handleRecord} className="btn btn-secondary text-xs">
						Dừng
					</button>
				)}
			</div>

			{recorder.error && (
				<div className="flex items-center gap-2 rounded-(--radius-button) border-2 border-destructive/30 bg-destructive-tint px-3 py-2 text-xs font-bold text-destructive">
					<span
						aria-hidden="true"
						className="flex size-4 shrink-0 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-white"
					>
						!
					</span>
					{recorder.error}
				</div>
			)}

			{recorder.audioUrl && (
				<div className="space-y-2 rounded-(--radius-card) border-2 border-b-4 border-border bg-surface p-3">
					<p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-muted">
						<Icon name="volume" size="xs" />
						Nghe lại bản ghi
					</p>
					<audio src={recorder.audioUrl} controls className="h-9 w-full" />
				</div>
			)}
		</div>
	)
}
