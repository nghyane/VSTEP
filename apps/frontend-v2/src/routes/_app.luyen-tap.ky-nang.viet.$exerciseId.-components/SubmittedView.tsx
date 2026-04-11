// SubmittedView — sau khi user nộp bài: feedback rule-based + sample + self-assessment.

import { Link } from "@tanstack/react-router"
import { Check, ChevronDown, RotateCcw, Star, X } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"
import type { WritingExercise } from "#/lib/mock/writing"
import { cn } from "#/lib/utils"
import type { WritingFeedback } from "./useWritingSession"

interface Props {
	exercise: WritingExercise
	userText: string
	feedback: WritingFeedback
	onReset: () => void
}

export function SubmittedView({ exercise, userText, feedback, onReset }: Props) {
	return (
		<div className="space-y-6">
			<FeedbackCard feedback={feedback} minWords={exercise.minWords} maxWords={exercise.maxWords} />
			<div className="grid gap-4 lg:grid-cols-2">
				<UserTextCard text={userText} />
				<SampleAnswerCard sample={exercise.sampleAnswer} />
			</div>
			<SelfAssessmentChecklist points={exercise.requiredPoints} />
			<div aria-hidden className="h-24" />
			<FooterBar onReset={onReset} />
		</div>
	)
}

// ─── Feedback ──────────────────────────────────────────────────────

function FeedbackCard({
	feedback,
	minWords,
	maxWords,
}: {
	feedback: WritingFeedback
	minWords: number
	maxWords: number
}) {
	return (
		<div className="rounded-2xl border bg-card p-5 shadow-sm">
			<div className="flex items-center justify-between">
				<h3 className="text-base font-bold">Đánh giá nhanh</h3>
				<StarRating value={feedback.stars} />
			</div>
			<ul className="mt-4 space-y-2 text-sm">
				<CheckRow
					ok={feedback.wordCountInRange}
					label={`Số từ ${feedback.wordCount} — yêu cầu ${minWords}-${maxWords}`}
				/>
				<CheckRow
					ok={feedback.keywordCoveragePct >= 60}
					label={`Dùng từ khóa: ${feedback.keywordCoveragePct}% (${feedback.keywordsHit.filter((k) => k.hit).length}/${feedback.keywordsHit.length})`}
				/>
				<CheckRow
					ok={feedback.hasMultipleParagraphs}
					label="Có cấu trúc nhiều đoạn (mở bài, thân bài, kết bài)"
				/>
			</ul>
			<KeywordHitList hits={feedback.keywordsHit} />
		</div>
	)
}

function StarRating({ value }: { value: number }) {
	return (
		<div className="flex items-center gap-0.5">
			{Array.from({ length: 5 }).map((_, i) => (
				<Star
					key={i}
					className={cn(
						"size-5",
						i < value ? "fill-warning text-warning" : "text-muted-foreground/40",
					)}
				/>
			))}
		</div>
	)
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
	return (
		<li className="flex items-start gap-2">
			{ok ? (
				<Check className="mt-0.5 size-4 shrink-0 text-success" />
			) : (
				<X className="mt-0.5 size-4 shrink-0 text-destructive" />
			)}
			<span className={cn("text-foreground/90", !ok && "text-muted-foreground")}>{label}</span>
		</li>
	)
}

function KeywordHitList({ hits }: { hits: WritingFeedback["keywordsHit"] }) {
	if (hits.length === 0) return null
	return (
		<div className="mt-4 flex flex-wrap gap-1.5">
			{hits.map((h) => (
				<span
					key={h.keyword}
					className={cn(
						"rounded-full border px-2 py-0.5 text-xs font-medium",
						h.hit
							? "border-success/40 bg-success/10 text-success"
							: "border-border bg-muted text-muted-foreground line-through",
					)}
				>
					{h.keyword}
				</span>
			))}
		</div>
	)
}

// ─── Text columns ──────────────────────────────────────────────────

function UserTextCard({ text }: { text: string }) {
	return (
		<section className="rounded-2xl border bg-card p-5 shadow-sm">
			<h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Bài của bạn
			</h4>
			<p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{text}</p>
		</section>
	)
}

function SampleAnswerCard({ sample }: { sample: string }) {
	const [open, setOpen] = useState(false)
	return (
		<section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				className="flex w-full items-center justify-between text-left"
			>
				<h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
					Bài mẫu {open ? "(đang hiện)" : "(click để xem)"}
				</h4>
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

// ─── Self-assessment ───────────────────────────────────────────────

function SelfAssessmentChecklist({ points }: { points: readonly string[] }) {
	const [checked, setChecked] = useState<Record<number, boolean>>({})
	return (
		<section className="rounded-2xl border bg-card p-5 shadow-sm">
			<h4 className="text-sm font-bold">Tự chấm</h4>
			<p className="mt-1 text-xs text-muted-foreground">
				So sánh bài của bạn với bài mẫu và đánh dấu các điểm đã đạt
			</p>
			<ul className="mt-4 space-y-2">
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

// ─── Footer ────────────────────────────────────────────────────────

function FooterBar({ onReset }: { onReset: () => void }) {
	return (
		<footer className="fixed right-0 bottom-0 left-[var(--dock-left)] z-20 flex flex-wrap items-center justify-between gap-3 border-t bg-background px-6 py-4">
			<Button type="button" variant="outline" onClick={onReset}>
				<RotateCcw className="size-4" />
				Viết lại
			</Button>
			<Button asChild>
				<Link to="/luyen-tap/ky-nang/viet">Về danh sách đề viết</Link>
			</Button>
		</footer>
	)
}
