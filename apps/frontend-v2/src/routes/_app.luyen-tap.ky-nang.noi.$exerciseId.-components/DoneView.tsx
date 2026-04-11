// DoneView — sau khi record xong: playback bản thu, nghe bài mẫu TTS, self-assessment.

import { Link } from "@tanstack/react-router"
import { ChevronDown, RotateCcw } from "lucide-react"
import { useState } from "react"
import { ChatGptIcon } from "#/components/common/ChatGptIcon"
import { Button } from "#/components/ui/button"
import type { SpeakingExercise } from "#/lib/mock/speaking"
import { cn } from "#/lib/utils"

interface Props {
	exercise: SpeakingExercise
	userAudioUrl: string | null
	recordedSeconds: number
	onReset: () => void
}

export function DoneView({ exercise, userAudioUrl, recordedSeconds, onReset }: Props) {
	return (
		<div className="space-y-6">
			<div className="rounded-2xl border bg-card p-6 shadow-sm">
				<h3 className="text-base font-bold">Bản ghi của bạn</h3>
				<p className="mt-1 text-xs text-muted-foreground">
					Thời lượng: {formatTime(recordedSeconds)}
				</p>
				{userAudioUrl ? (
					<audio src={userAudioUrl} controls className="mt-4 w-full">
						<track kind="captions" />
					</audio>
				) : (
					<p className="mt-3 text-sm text-muted-foreground">Không có bản ghi.</p>
				)}
			</div>

			<SampleAnswerCard sample={exercise.sampleAnswer} />

			<SelfAssessmentChecklist points={exercise.talkingPoints} />
			<div aria-hidden className="h-24" />

			<footer className="fixed right-0 bottom-0 left-[var(--dock-left)] z-20 flex items-center justify-between border-t bg-background px-6 py-4">
				<Button type="button" variant="outline" onClick={onReset}>
					<RotateCcw className="size-4" />
					Thu lại
				</Button>
				<Button asChild>
					<Link to="/luyen-tap/ky-nang/noi">Về danh sách đề nói</Link>
				</Button>
			</footer>
		</div>
	)
}

function SampleAnswerCard({ sample }: { sample: string }) {
	const [open, setOpen] = useState(true)
	return (
		<section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				className="flex w-full items-center justify-between text-left"
			>
				<span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
					<ChatGptIcon className="size-4" />
					Bài mẫu tham khảo
				</span>
				<ChevronDown
					className={cn("size-4 text-primary transition-transform", open && "rotate-180")}
				/>
			</button>
			{open && (
				<p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
					{sample}
				</p>
			)}
		</section>
	)
}

function SelfAssessmentChecklist({ points }: { points: readonly string[] }) {
	const [checked, setChecked] = useState<Record<number, boolean>>({})
	return (
		<section className="rounded-2xl border bg-card p-5 shadow-sm">
			<h4 className="text-sm font-bold">Tự chấm — bạn đã nói đủ những điểm sau chưa?</h4>
			<ul className="mt-3 space-y-2">
				{points.map((point, idx) => (
					<li key={point}>
						<label className="flex cursor-pointer items-start gap-3 text-sm">
							<input
								type="checkbox"
								checked={checked[idx] ?? false}
								onChange={(e) => setChecked((prev) => ({ ...prev, [idx]: e.target.checked }))}
								className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary/30"
							/>
							<span className="text-foreground/90">{point}</span>
						</label>
					</li>
				))}
			</ul>
		</section>
	)
}

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = Math.floor(seconds % 60)
	return `${m}:${String(s).padStart(2, "0")}`
}
