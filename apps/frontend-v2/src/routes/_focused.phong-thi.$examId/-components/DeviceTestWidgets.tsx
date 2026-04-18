// DeviceTestWidgets — AudioTestPlayer + MicTest cho device check screen.

import { Mic, Pause, Play, Square, Volume2 } from "lucide-react"
import { motion } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useVoiceRecorder } from "#/features/practice/lib/use-voice-recorder"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"

const TEST_AUDIO_URL =
	"https://luyenthivstep.vn/assets/nhch/listening/bac3/lp1-1642953803_eb7ab6f2e8dead6de076.mp3"

export function AudioTestPlayer() {
	const audioRef = useRef<HTMLAudioElement>(null)
	const [playing, setPlaying] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const [passed, setPassed] = useState(false)
	const fmt = (s: number) => {
		const m = Math.floor(s / 60)
		const sec = Math.floor(s % 60)
		return `${m}:${String(sec).padStart(2, "0")}`
	}
	const toggle = useCallback(() => {
		const audio = audioRef.current
		if (!audio) return
		if (playing) {
			audio.pause()
			setPlaying(false)
		} else {
			audio.play().catch(() => {})
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
			<div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
				<motion.button
					type="button"
					onClick={toggle}
					whileTap={{ scale: 0.9 }}
					transition={{ type: "spring", stiffness: 500, damping: 30 }}
					className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
				>
					{playing ? <Pause className="size-4" /> : <Play className="size-4" />}
				</motion.button>
				<span className="font-mono text-xs tabular-nums text-muted-foreground">
					{fmt(currentTime)} / {fmt(duration)}
				</span>
				<div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
					<div
						className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-200"
						style={{ width: `${progress}%` }}
					/>
				</div>
				<Volume2 className="size-4 text-muted-foreground" />
			</div>
			{passed && <p className="text-xs font-medium text-success">Âm thanh hoạt động tốt</p>}
			{/* biome-ignore lint/a11y/useMediaCaption: test audio */}
			<audio ref={audioRef} src={TEST_AUDIO_URL} preload="metadata" className="hidden" />
		</div>
	)
}

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
					"flex h-12 items-center justify-center rounded-lg border",
					isRecording ? "border-destructive/30 bg-destructive/5" : "bg-muted/30",
				)}
			>
				{recorder.state !== "recording" && recorder.audioUrl === null && (
					<span className="text-xs text-muted-foreground">Đặt mic sát miệng rồi bấm "Thu âm"</span>
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
					<span className="text-xs text-muted-foreground">Đã thu xong — microphone hoạt động</span>
				)}
			</div>
			<div className="flex flex-wrap items-center gap-2">
				{!isRecording && (
					<Button size="sm" variant="destructive" onClick={handleRecord}>
						<Mic className="size-4" />
						{recorder.audioUrl ? "Thu lại" : "Thu âm"}
					</Button>
				)}
				{isRecording && (
					<Button size="sm" variant="outline" onClick={handleRecord}>
						<Square className="size-3.5" />
						Dừng
					</Button>
				)}
			</div>
			{recorder.error && <p className="text-xs text-destructive">{recorder.error}</p>}
			{recorder.audioUrl && (
				<div className="space-y-2 rounded-lg border bg-background p-3">
					<p className="text-xs font-medium text-muted-foreground">Nghe lại bản ghi của bạn</p>
					<audio src={recorder.audioUrl} controls className="h-9 w-full">
						<track kind="captions" />
					</audio>
				</div>
			)}
			{recorder.audioUrl && (
				<p className="text-xs font-medium text-success">Microphone hoạt động tốt</p>
			)}
		</div>
	)
}
