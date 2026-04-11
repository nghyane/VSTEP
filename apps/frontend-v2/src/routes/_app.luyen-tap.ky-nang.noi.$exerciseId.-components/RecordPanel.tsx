// RecordPanel — nút record tròn lớn + timer + waveform CSS.

import { Mic, Square } from "lucide-react"
import { Button } from "#/components/ui/button"
import type { VoiceRecorder } from "#/lib/practice/use-voice-recorder"
import { cn } from "#/lib/utils"

interface Props {
	recorder: VoiceRecorder
	maxSeconds: number
	onStop: () => void
}

export function RecordPanel({ recorder, maxSeconds, onStop }: Props) {
	const elapsedSec = Math.floor(recorder.elapsedMs / 1000)
	const remainingSec = Math.max(0, maxSeconds - elapsedSec)
	const isRecording = recorder.state === "recording"

	return (
		<div className="flex flex-col items-center gap-5 rounded-2xl border bg-card p-8 shadow-sm">
			<div
				className={cn(
					"flex size-24 items-center justify-center rounded-full border-4 transition-colors",
					isRecording
						? "border-destructive bg-destructive/10"
						: "border-border bg-muted text-muted-foreground",
				)}
			>
				<Mic
					className={cn(
						"size-10",
						isRecording ? "animate-pulse text-destructive" : "text-muted-foreground",
					)}
				/>
			</div>
			<TimerDisplay elapsed={elapsedSec} remaining={remainingSec} max={maxSeconds} />
			{isRecording && (
				<Button
					type="button"
					size="lg"
					variant="outline"
					onClick={onStop}
					className="gap-2 rounded-full px-6"
				>
					<Square className="size-4 fill-destructive text-destructive" />
					Dừng và kết thúc
				</Button>
			)}
			{recorder.state === "requesting" && (
				<p className="text-sm text-muted-foreground">Đang yêu cầu quyền truy cập micro...</p>
			)}
			{recorder.state === "denied" && recorder.error && <MicDeniedNotice error={recorder.error} />}
		</div>
	)
}

function TimerDisplay({
	elapsed,
	remaining,
	max,
}: {
	elapsed: number
	remaining: number
	max: number
}) {
	const pct = Math.min(100, (elapsed / max) * 100)
	const warning = remaining <= 10
	return (
		<div className="w-full max-w-md space-y-2">
			<div className="flex items-center justify-between text-sm tabular-nums">
				<span className="font-mono font-semibold text-destructive">{formatTime(elapsed)}</span>
				<span
					className={cn(
						"font-mono font-semibold",
						warning ? "text-destructive" : "text-muted-foreground",
					)}
				>
					còn {formatTime(remaining)}
				</span>
			</div>
			<div className="h-1.5 overflow-hidden rounded-full bg-muted">
				<div
					className={cn(
						"h-full rounded-full transition-all",
						warning ? "bg-destructive" : "bg-skill-speaking",
					)}
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	)
}

function MicDeniedNotice({ error }: { error: string }) {
	return (
		<div className="w-full max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
			<p className="font-semibold text-destructive">Không truy cập được micro</p>
			<p className="mt-1 text-xs text-muted-foreground">{error}</p>
			<p className="mt-2 text-xs text-muted-foreground">
				Hãy cấp quyền truy cập micro trong cài đặt trình duyệt, sau đó thử lại.
			</p>
		</div>
	)
}

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = Math.floor(seconds % 60)
	return `${m}:${String(s).padStart(2, "0")}`
}
