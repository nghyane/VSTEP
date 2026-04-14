import { Headphones, Mic, Play, Pause, Square, Volume2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "#/components/ui/button"
import type { ExamSkillKey, MockExamSession } from "#/lib/mock/exam-session"
import { cn } from "#/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const TEST_AUDIO_URL =
	"https://luyenthivstep.vn/assets/nhch/listening/bac3/lp1-1642953803_eb7ab6f2e8dead6de076.mp3"

const SKILL_DURATION: Record<ExamSkillKey, number> = {
	listening: 40,
	reading: 60,
	writing: 60,
	speaking: 12,
}

const SKILL_LABEL: Record<ExamSkillKey, string> = {
	listening: "Nghe",
	reading: "Đọc",
	writing: "Viết",
	speaking: "Nói",
}

// ─── Audio test player ────────────────────────────────────────────────────────

function AudioTestPlayer() {
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
				<button
					type="button"
					onClick={toggle}
					className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
				>
					{playing ? <Pause className="size-4" /> : <Play className="size-4" />}
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
				<Volume2 className="size-4 text-muted-foreground" />
			</div>
			{passed && <p className="text-xs font-medium text-emerald-600">✓ Âm thanh hoạt động tốt</p>}
			{/* biome-ignore lint/a11y/useMediaCaption: test audio */}
			<audio ref={audioRef} src={TEST_AUDIO_URL} preload="metadata" className="hidden" />
		</div>
	)
}

// ─── Mic test (simulated) ─────────────────────────────────────────────────────

function MicTest() {
	type Phase = "idle" | "recording" | "done"
	const [phase, setPhase] = useState<Phase>("idle")
	const [countdown, setCountdown] = useState(0)

	useEffect(() => {
		if (phase !== "recording") return
		setCountdown(5)
		const id = setInterval(() => {
			setCountdown((c) => {
				if (c <= 1) {
					setPhase("done")
					return 0
				}
				return c - 1
			})
		}, 1000)
		return () => clearInterval(id)
	}, [phase])

	return (
		<div className="space-y-3">
			<div
				className={cn(
					"flex h-12 items-center justify-center rounded-lg border",
					phase === "recording" ? "border-destructive/30 bg-destructive/5" : "bg-muted/30",
				)}
			>
				{phase === "idle" && (
					<span className="text-xs text-muted-foreground">Đặt mic sát miệng rồi bấm "Thu âm"</span>
				)}
				{phase === "recording" && (
					<div className="flex items-center gap-2">
						<span className="size-2 animate-pulse rounded-full bg-destructive" />
						<span className="text-xs font-medium text-destructive">
							Đang thu âm... {countdown}s
						</span>
					</div>
				)}
				{phase === "done" && (
					<span className="text-xs text-muted-foreground">Đã thu xong — microphone hoạt động</span>
				)}
			</div>
			<div className="flex flex-wrap items-center gap-2">
				{phase === "idle" && (
					<Button size="sm" variant="destructive" onClick={() => setPhase("recording")}>
						<Mic className="size-4" />
						Thu âm
					</Button>
				)}
				{phase === "recording" && (
					<Button size="sm" variant="outline" onClick={() => setPhase("done")}>
						<Square className="size-3.5" />
						Dừng
					</Button>
				)}
				{phase === "done" && (
					<Button size="sm" variant="outline" onClick={() => setPhase("idle")}>
						<Mic className="size-4 text-destructive" />
						Thu lại
					</Button>
				)}
			</div>
			{phase === "done" && (
				<p className="text-xs font-medium text-emerald-600">✓ Microphone hoạt động tốt</p>
			)}
		</div>
	)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
	session: MockExamSession
	onStart: () => void
}

const SKILL_ORDER: ExamSkillKey[] = ["listening", "reading", "writing", "speaking"]

export function DeviceCheckScreen({ session, onStart }: Props) {
	const activeSkills = SKILL_ORDER.filter((sk) => {
		if (sk === "listening") return session.listening.length > 0
		if (sk === "reading") return session.reading.length > 0
		if (sk === "writing") return session.writing.length > 0
		if (sk === "speaking") return session.speaking.length > 0
		return false
	})

	const hasSpeaking = activeSkills.includes("speaking")
	const hasListening = activeSkills.includes("listening")

	return (
		<div className="flex h-full flex-col items-center overflow-y-auto bg-muted/30">
			<div className="w-full max-w-4xl space-y-6 p-6 py-10">
				{/* Title */}
				<div className="space-y-1 text-center">
					<h1 className="text-xl font-bold">{session.title}</h1>
					<p className="text-sm text-muted-foreground">
						Kiểm tra thiết bị trước khi bắt đầu làm bài
					</p>
				</div>

				{/* 3 cards */}
				<div className="grid gap-4 md:grid-cols-3">
					{/* Card 1: Exam structure */}
					<div className="space-y-4 rounded-xl border bg-background p-5">
						<div className="flex items-center gap-2.5">
							<span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
								1
							</span>
							<h2 className="text-sm font-semibold uppercase tracking-wide">Cấu trúc bài thi</h2>
						</div>
						<ul className="space-y-2 text-sm">
							{activeSkills.map((sk, i) => (
								<li key={sk} className="flex items-center gap-2.5">
									<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
										{i + 1}
									</span>
									<span>
										<span className="font-semibold">{SKILL_LABEL[sk].toUpperCase()}</span>{" "}
										&ndash; {SKILL_DURATION[sk]} phút
									</span>
								</li>
							))}
						</ul>
						<div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
							Tổng thời gian:{" "}
							<span className="font-semibold text-foreground">{session.durationMinutes} phút</span>
						</div>
					</div>

					{/* Card 2: Audio & Mic check */}
					<div className="space-y-4 rounded-xl border bg-background p-5">
						<div className="flex items-center gap-2.5">
							<span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
								2
							</span>
							<h2 className="text-sm font-semibold uppercase tracking-wide">Kiểm tra âm thanh</h2>
						</div>

						{hasListening && (
							<div className="space-y-2">
								<div className="flex items-center gap-1.5">
									<Headphones className="size-3.5 text-muted-foreground" />
									<span className="text-xs font-medium">Bước 1: Nghe đoạn audio</span>
								</div>
								<AudioTestPlayer />
							</div>
						)}

						{hasSpeaking && (
							<div className={cn("space-y-2", hasListening && "border-t pt-4")}>
								<div className="flex items-center gap-1.5">
									<Mic className="size-3.5 text-muted-foreground" />
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
					<div className="space-y-4 rounded-xl border bg-background p-5">
						<div className="flex items-center gap-2.5">
							<span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
								3
							</span>
							<h2 className="text-sm font-semibold uppercase tracking-wide">Lưu ý</h2>
						</div>
						<ul className="space-y-2.5 text-sm text-muted-foreground">
							{[
								"Sau khi chuyển phần, không thể quay lại phần trước.",
								"Câu trả lời được tự động lưu trong quá trình làm bài.",
								'Bấm "Phần tiếp" để sang kỹ năng kế tiếp.',
								'Bấm "Nộp bài" khi đã hoàn thành tất cả phần.',
							].map((note) => (
								<li key={note} className="flex gap-2">
									<span className="shrink-0 text-muted-foreground/60">–</span>
									<span>{note}</span>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Start button */}
				<div className="flex flex-col items-center gap-3 pt-2">
					<Button size="lg" className="w-full max-w-xs text-base" onClick={onStart}>
						Nhận đề &amp; bắt đầu
					</Button>
					<p className="text-xs text-muted-foreground">
						Thời gian sẽ bắt đầu tính khi bạn bấm nút trên
					</p>
				</div>
			</div>
		</div>
	)
}
