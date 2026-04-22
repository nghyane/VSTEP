import { useState } from "react"
import type { ExamVersionSpeakingPart } from "#/features/exam/types"
import { useVoiceRecorder } from "#/features/practice/use-voice-recorder"
import { cn } from "#/lib/utils"

interface Props {
	parts: ExamVersionSpeakingPart[]
	speakingDone: Set<string>
	onMarkDone: (partId: string) => void
}

interface PartRecorderProps {
	part: ExamVersionSpeakingPart
	isDone: boolean
	onDone: (partId: string) => void
}

const PART_TYPE_LABEL: Record<string, string> = {
	introduction: "Giới thiệu bản thân",
	picture_description: "Mô tả hình ảnh",
	extended_discussion: "Thảo luận mở rộng",
	interview: "Phỏng vấn",
	task: "Nhiệm vụ nói",
}

function formatElapsed(ms: number): string {
	const total = Math.floor(ms / 1000)
	const m = Math.floor(total / 60)
		.toString()
		.padStart(2, "0")
	const s = (total % 60).toString().padStart(2, "0")
	return `${m}:${s}`
}

function WaveformBar({ analyser }: { analyser: AnalyserNode | null }) {
	if (!analyser) return null
	return (
		<div className="flex items-center gap-0.5 h-8">
			{Array.from({ length: 20 }).map((_, i) => (
				<div
					key={i}
					className="w-1 rounded-full bg-skill-speaking animate-pulse"
					style={{ height: `${20 + Math.random() * 60}%`, animationDelay: `${i * 50}ms` }}
				/>
			))}
		</div>
	)
}

function PartRecorder({ part, isDone, onDone }: PartRecorderProps) {
	const maxSeconds = part.duration_minutes * 60
	const recorder = useVoiceRecorder(maxSeconds)
	const typeLabel = PART_TYPE_LABEL[part.type] ?? part.type

	const handleFinish = () => {
		recorder.stop()
		onDone(part.id)
	}

	return (
		<div className="space-y-6">
			{/* Part header */}
			<div className="flex items-center gap-3">
				<span className="rounded-full bg-skill-speaking/15 px-3 py-1 text-xs font-bold text-skill-speaking">
					Phần {part.part}
				</span>
				<span className="text-sm font-semibold text-foreground">{typeLabel}</span>
				<span className="ml-auto text-xs text-muted">{part.duration_minutes} phút</span>
			</div>

			{/* Recording UI */}
			<div className="card p-6 space-y-5">
				{/* Status */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						{recorder.state === "recording" && (
							<>
								<span className="size-2.5 rounded-full bg-destructive animate-pulse" />
								<span className="text-sm font-semibold text-destructive">Đang ghi âm</span>
							</>
						)}
						{recorder.state === "stopped" && (
							<span className="text-sm font-semibold text-success">✓ Đã hoàn thành</span>
						)}
						{recorder.state === "idle" && <span className="text-sm text-muted">Nhấn ghi âm để bắt đầu</span>}
						{recorder.state === "requesting" && (
							<span className="text-sm text-muted">Đang xin quyền microphone...</span>
						)}
						{recorder.state === "denied" && (
							<span className="text-sm text-destructive">Không có quyền microphone</span>
						)}
					</div>
					{recorder.state === "recording" && (
						<span className="text-sm tabular-nums font-bold text-muted">
							{formatElapsed(recorder.elapsedMs)} / {formatElapsed(maxSeconds * 1000)}
						</span>
					)}
				</div>

				{/* Waveform */}
				{recorder.state === "recording" && (
					<div className="flex items-center justify-center py-2">
						<WaveformBar analyser={recorder.analyser} />
					</div>
				)}

				{/* Playback */}
				{recorder.audioUrl && recorder.state === "stopped" && (
					<audio src={recorder.audioUrl} controls className="w-full" />
				)}

				{/* Actions */}
				<div className="flex items-center gap-3">
					{recorder.state === "idle" && (
						<button
							type="button"
							onClick={recorder.start}
							className="flex items-center gap-2 rounded-xl bg-skill-speaking px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
						>
							<span className="size-2 rounded-full bg-white" />
							Bắt đầu ghi
						</button>
					)}
					{recorder.state === "recording" && (
						<button
							type="button"
							onClick={handleFinish}
							className="flex items-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
						>
							<span className="size-2 rounded-full bg-white" />
							Dừng
						</button>
					)}
					{recorder.state === "stopped" && (
						<>
							<button
								type="button"
								onClick={recorder.reset}
								className="rounded-xl border-2 border-border px-5 py-2.5 text-sm font-semibold text-muted hover:border-border hover:text-foreground transition-colors"
							>
								Ghi lại
							</button>
							{!isDone && (
								<button
									type="button"
									onClick={handleFinish}
									className="rounded-xl bg-skill-speaking px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
								>
									✓ Xác nhận
								</button>
							)}
						</>
					)}
				</div>

				{recorder.error && <p className="text-sm text-destructive">{recorder.error}</p>}
			</div>

			{isDone && (
				<div className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-semibold text-success">
					<span>✓</span>
					<span>Phần {part.part} đã hoàn thành</span>
				</div>
			)}
		</div>
	)
}

export function SpeakingPanel({ parts, speakingDone, onMarkDone }: Props) {
	const [activeIdx, setActiveIdx] = useState(0)
	const active = parts[activeIdx]

	return (
		<div className="flex h-full flex-col">
			{/* Part tabs */}
			{parts.length > 1 && (
				<div className="flex shrink-0 gap-1 border-b border-border bg-card px-5 py-2">
					{parts.map((p, idx) => (
						<button
							key={p.id}
							type="button"
							onClick={() => setActiveIdx(idx)}
							className={cn(
								"relative rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
								activeIdx === idx
									? "bg-skill-speaking/15 text-skill-speaking"
									: "text-muted hover:text-foreground hover:bg-surface",
							)}
						>
							Phần {p.part}
							{speakingDone.has(p.id) && (
								<span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-success" />
							)}
						</button>
					))}
				</div>
			)}

			{/* Content */}
			<div className="flex-1 overflow-y-auto px-5 py-6">
				<div className="mx-auto max-w-lg">
					{active && (
						<PartRecorder
							key={active.id}
							part={active}
							isDone={speakingDone.has(active.id)}
							onDone={onMarkDone}
						/>
					)}
				</div>
			</div>
		</div>
	)
}
