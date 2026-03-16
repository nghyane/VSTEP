import {
	HeadphonesIcon,
	Mic01Icon,
	PauseIcon,
	PlayIcon,
	RecordIcon,
	SquareIcon,
	VolumeHighIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useReactMediaRecorder } from "react-media-recorder"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { skillMeta } from "@/routes/_learner/exams/-components/skill-meta"
import type { Skill } from "@/types/api"

// --- Types ---

interface SkillInfo {
	skill: Skill
	sections: number
}

interface DeviceCheckScreenProps {
	examTitle: string
	durationMinutes: number
	skills: SkillInfo[]
	onStart: () => void
}

// --- Skill duration estimates (VSTEP standard) ---

const SKILL_DURATION: Record<Skill, number> = {
	listening: 47,
	reading: 60,
	writing: 60,
	speaking: 12,
}

// --- Test audio from real VSTEP data ---

const TEST_AUDIO_URL =
	"https://luyenthivstep.vn/assets/nhch/listening/bac3/lp1-1642953803_eb7ab6f2e8dead6de076.mp3"

// --- Audio Player with controls ---

function AudioTestPlayer() {
	const audioRef = useRef<HTMLAudioElement>(null)
	const [playing, setPlaying] = useState(false)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const [passed, setPassed] = useState(false)

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

	const fmt = (s: number) => {
		const m = Math.floor(s / 60)
		const sec = Math.floor(s % 60)
		return `${m}:${String(sec).padStart(2, "0")}`
	}

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
				<button
					type="button"
					onClick={toggle}
					className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
				>
					<HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} className="size-4" />
				</button>
				<span className="font-mono text-xs tabular-nums text-muted-foreground">
					{fmt(currentTime)} / {fmt(duration)}
				</span>
				<div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
					<div
						className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-200"
						style={{ width: `${progress}%` }}
					/>
				</div>
				<HugeiconsIcon icon={VolumeHighIcon} className="size-4 text-muted-foreground" />
			</div>
			{passed && <p className="text-xs font-medium text-emerald-600">✓ Âm thanh hoạt động tốt</p>}
			{/* biome-ignore lint/a11y/useMediaCaption: test audio */}
			<audio ref={audioRef} src={TEST_AUDIO_URL} preload="metadata" className="hidden" />
		</div>
	)
}

// --- Mic Recorder using react-media-recorder ---

function MicTest() {
	const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } =
		useReactMediaRecorder({
			audio: true,
			video: false,
			askPermissionOnMount: false,
		})

	const playbackRef = useRef<HTMLAudioElement>(null)
	const [playingBack, setPlayingBack] = useState(false)
	const [countdown, setCountdown] = useState(0)

	// Auto-stop after 5s
	useEffect(() => {
		if (status !== "recording") {
			setCountdown(0)
			return
		}
		setCountdown(5)
		const interval = setInterval(() => {
			setCountdown((c) => {
				if (c <= 1) {
					stopRecording()
					return 0
				}
				return c - 1
			})
		}, 1000)
		return () => clearInterval(interval)
	}, [status, stopRecording])

	const handlePlayback = useCallback(() => {
		const audio = playbackRef.current
		if (!audio || !mediaBlobUrl) return
		audio.src = mediaBlobUrl
		audio.onended = () => setPlayingBack(false)
		audio.play().catch(() => {})
		setPlayingBack(true)
	}, [mediaBlobUrl])

	const handleRetry = useCallback(() => {
		clearBlobUrl()
		setPlayingBack(false)
	}, [clearBlobUrl])

	const hasRecording = status === "stopped" && mediaBlobUrl
	const isError = status === "permission_denied" || status === "no_specified_media_found"

	return (
		<div className="space-y-3">
			{/* Waveform placeholder */}
			<div
				className={cn(
					"flex h-12 items-center justify-center rounded-lg border",
					status === "recording" ? "border-destructive/30 bg-destructive/5" : "bg-muted/30",
				)}
			>
				{status === "recording" ? (
					<div className="flex items-center gap-2">
						<span className="size-2 animate-pulse rounded-full bg-destructive" />
						<span className="text-xs font-medium text-destructive">
							Đang thu âm... {countdown}s
						</span>
					</div>
				) : hasRecording ? (
					<span className="text-xs text-muted-foreground">
						Đã thu xong — bấm "Nghe lại" để kiểm tra
					</span>
				) : (
					<span className="text-xs text-muted-foreground">Đặt mic sát miệng rồi bấm "Thu âm"</span>
				)}
			</div>

			{/* Buttons */}
			<div className="flex flex-wrap items-center gap-2">
				{!hasRecording && status !== "recording" && (
					<Button size="sm" variant="destructive" onClick={startRecording}>
						<HugeiconsIcon icon={RecordIcon} className="size-4" />
						Thu âm
					</Button>
				)}
				{status === "recording" && (
					<Button size="sm" variant="outline" onClick={stopRecording}>
						<HugeiconsIcon icon={SquareIcon} className="size-3.5" />
						Dừng
					</Button>
				)}
				{hasRecording && (
					<>
						<Button size="sm" variant="outline" onClick={handlePlayback} disabled={playingBack}>
							<HugeiconsIcon icon={VolumeHighIcon} className="size-4" />
							{playingBack ? "Đang phát..." : "Nghe lại"}
						</Button>
						<Button size="sm" variant="outline" onClick={handleRetry}>
							<HugeiconsIcon icon={RecordIcon} className="size-4 text-destructive" />
							Thu lại
						</Button>
					</>
				)}
			</div>

			{isError && (
				<p className="text-xs text-destructive">
					Không thể truy cập microphone. Hãy cấp quyền trên trình duyệt.
				</p>
			)}
			{hasRecording && (
				<p className="text-xs font-medium text-emerald-600">✓ Microphone hoạt động tốt</p>
			)}

			{/* biome-ignore lint/a11y/useMediaCaption: playback */}
			<audio ref={playbackRef} className="hidden" />
		</div>
	)
}

// --- Main Screen ---

export function DeviceCheckScreen({
	examTitle,
	durationMinutes,
	skills,
	onStart,
}: DeviceCheckScreenProps) {
	const hasSpeaking = skills.some((s) => s.skill === "speaking")
	const hasListening = skills.some((s) => s.skill === "listening")

	return (
		<div className="flex h-full flex-col items-center overflow-y-auto bg-muted/30">
			<div className="w-full max-w-4xl space-y-6 p-6 py-10">
				{/* Title */}
				<div className="space-y-1 text-center">
					<h1 className="text-xl font-bold">{examTitle}</h1>
					<p className="text-sm text-muted-foreground">
						Kiểm tra thiết bị trước khi bắt đầu làm bài
					</p>
				</div>

				{/* 3-column cards */}
				<div className="grid gap-4 md:grid-cols-3">
					{/* Card 1: Exam structure */}
					<div className="rounded-xl border bg-background p-5 space-y-4">
						<div className="flex items-center gap-2.5">
							<span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
								1
							</span>
							<h2 className="text-sm font-semibold uppercase tracking-wide">Cấu trúc bài thi</h2>
						</div>
						<ul className="space-y-2 text-sm">
							{skills.map((s, i) => (
								<li key={s.skill} className="flex items-center gap-2.5">
									<HugeiconsIcon
										icon={skillMeta[s.skill].icon}
										className="size-4 text-muted-foreground"
									/>
									<span>
										Kỹ năng {i + 1}:{" "}
										<span className="font-semibold">{skillMeta[s.skill].label.toUpperCase()}</span>{" "}
										&ndash; {s.sections} phần ({SKILL_DURATION[s.skill]} phút)
									</span>
								</li>
							))}
						</ul>
						<div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
							Tổng thời gian:{" "}
							<span className="font-semibold text-foreground">{durationMinutes} phút</span>
						</div>
					</div>

					{/* Card 2: Audio + Mic check */}
					<div className="rounded-xl border bg-background p-5 space-y-4">
						<div className="flex items-center gap-2.5">
							<span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
								2
							</span>
							<h2 className="text-sm font-semibold uppercase tracking-wide">Kiểm tra âm thanh</h2>
						</div>

						{/* Step 1: Audio playback */}
						{hasListening && (
							<div className="space-y-2">
								<div className="flex items-center gap-1.5">
									<HugeiconsIcon icon={HeadphonesIcon} className="size-3.5 text-muted-foreground" />
									<span className="text-xs font-medium">Bước 1: Nghe đoạn audio</span>
								</div>
								<AudioTestPlayer />
							</div>
						)}

						{/* Step 2: Mic test */}
						{hasSpeaking && (
							<div className="space-y-2 border-t pt-4">
								<div className="flex items-center gap-1.5">
									<HugeiconsIcon icon={Mic01Icon} className="size-3.5 text-muted-foreground" />
									<span className="text-xs font-medium">
										Bước {hasListening ? 2 : 1}: Thu âm thử → Nghe lại
									</span>
								</div>
								<MicTest />
							</div>
						)}

						{!hasListening && !hasSpeaking && (
							<p className="text-sm text-muted-foreground">
								Bài thi này không yêu cầu kiểm tra âm thanh.
							</p>
						)}
					</div>

					{/* Card 3: Notes */}
					<div className="rounded-xl border bg-background p-5 space-y-4">
						<div className="flex items-center gap-2.5">
							<span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
								3
							</span>
							<h2 className="text-sm font-semibold uppercase tracking-wide">Lưu ý</h2>
						</div>
						<ul className="space-y-2.5 text-sm text-muted-foreground">
							<li className="flex gap-2">
								<span className="text-muted-foreground/60">&ndash;</span>
								<span>
									Khi hết thời gian mỗi kỹ năng, hệ thống{" "}
									<span className="font-medium text-foreground">tự động chuyển tiếp</span>.
								</span>
							</li>
							<li className="flex gap-2">
								<span className="text-muted-foreground/60">&ndash;</span>
								<span>
									Sau khi chuyển phần,{" "}
									<span className="font-medium text-foreground">không thể quay lại</span> phần
									trước.
								</span>
							</li>
							<li className="flex gap-2">
								<span className="text-muted-foreground/60">&ndash;</span>
								<span>Câu trả lời được tự động lưu trong quá trình làm bài.</span>
							</li>
							<li className="flex gap-2">
								<span className="text-muted-foreground/60">&ndash;</span>
								<span>
									Bấm "<span className="font-medium text-foreground">Phần tiếp</span>" để sang kỹ
									năng kế tiếp.
								</span>
							</li>
						</ul>
					</div>
				</div>

				{/* Start button */}
				<div className="flex flex-col items-center gap-3 pt-2">
					<Button size="lg" className="w-full max-w-xs text-base" onClick={onStart}>
						Nhận đề
					</Button>
					<p className="text-xs text-muted-foreground">
						Thời gian sẽ bắt đầu tính khi bạn bấm nút trên
					</p>
				</div>
			</div>
		</div>
	)
}
