import { useCallback, useMemo, useState } from "react"
import { ScrollArea } from "#/components/ScrollArea"
import type { ExamVersionWritingTask } from "#/features/exam/types"
import { cn } from "#/lib/utils"

interface FooterAction {
	skillLabel: string
	skillProgress: string
	isLastSkill: boolean
	isSubmitting: boolean
	onSubmit: () => void
	onNext: () => void
}

interface Props {
	tasks: ExamVersionWritingTask[]
	writingAnswers: Map<string, string>
	onAnswer: (taskId: string, text: string) => void
	footer: FooterAction
}

const TASK_TYPE_LABEL: Record<string, string> = {
	letter: "Thư",
	essay: "Bài luận",
	formal_letter: "Thư trang trọng",
	informal_letter: "Thư thân mật",
}

export function WritingPanel({ tasks, writingAnswers, onAnswer, footer }: Props) {
	const sorted = useMemo(() => [...tasks].sort((a, b) => a.display_order - b.display_order), [tasks])
	const [activeIdx, setActiveIdx] = useState(0)

	const activeTask = sorted[activeIdx]
	const currentText = activeTask ? (writingAnswers.get(activeTask.id) ?? "") : ""

	const wordCount = useMemo(() => currentText.trim().split(/\s+/).filter(Boolean).length, [currentText])

	const tasksMeta = useMemo(
		() =>
			sorted.map((t) => {
				const text = writingAnswers.get(t.id) ?? ""
				const wc = text.trim().split(/\s+/).filter(Boolean).length
				return {
					typeLabel: TASK_TYPE_LABEL[t.task_type] ?? t.task_type,
					wordCount: wc,
					minWords: t.min_words,
				}
			}),
		[sorted, writingAnswers],
	)

	const handlePrev = useCallback(() => setActiveIdx((i) => Math.max(0, i - 1)), [])
	const handleNext = useCallback(
		() => setActiveIdx((i) => Math.min(i + 1, sorted.length - 1)),
		[sorted.length],
	)

	if (!activeTask) return null

	const isUnder = wordCount < activeTask.min_words
	const pct = activeTask.min_words > 0 ? Math.min(100, (wordCount / activeTask.min_words) * 100) : 0

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* Split layout */}
			<div className="flex flex-1 overflow-hidden">
				{/* Prompt */}
				<ScrollArea className="w-2/5 border-r border-border">
					<div className="space-y-4 bg-background px-7 py-6">
						<div className="flex flex-wrap items-center gap-2">
							<span className="rounded-full border-2 border-b-4 border-skill-writing/30 bg-skill-writing/10 px-3 py-1 text-xs font-extrabold text-skill-writing">
								Phần {activeTask.part}
							</span>
							<span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
								{TASK_TYPE_LABEL[activeTask.task_type] ?? activeTask.task_type}
							</span>
							<span className="ml-auto text-xs text-muted">{activeTask.duration_minutes} phút</span>
						</div>

						<div className="rounded-(--radius-card) border-2 border-b-4 border-border bg-surface p-5">
							<p className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-muted">Đề bài</p>
							<p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
								{activeTask.prompt}
							</p>
						</div>

						<p className="text-xs text-muted">Tối thiểu {activeTask.min_words} từ</p>
					</div>
				</ScrollArea>

				{/* Editor */}
				<div className="flex flex-1 flex-col gap-4 bg-background px-6 py-6">
					<div className="flex items-center justify-between">
						<p className="text-sm font-extrabold text-foreground">Bài làm</p>
						<span
							className={cn(
								"text-xs font-bold tabular-nums",
								wordCount >= activeTask.min_words
									? "text-primary"
									: isUnder && wordCount > 0
										? "text-warning"
										: "text-muted",
							)}
						>
							{wordCount} / {activeTask.min_words} từ
						</span>
					</div>

					<textarea
						value={currentText}
						onChange={(e) => onAnswer(activeTask.id, e.target.value)}
						placeholder="Viết bài làm của bạn ở đây..."
						className="flex-1 resize-none rounded-(--radius-card) border-2 border-border bg-surface p-4 text-sm leading-relaxed text-foreground placeholder:text-placeholder outline-none transition-colors focus:border-primary"
						aria-label={`Bài làm phần ${activeTask.part}`}
					/>

					{/* Word count progress bar */}
					<div className="space-y-1.5">
						<div className="h-1.5 overflow-hidden rounded-full bg-border">
							<div
								className={cn(
									"h-full rounded-full transition-[width] duration-300",
									wordCount >= activeTask.min_words ? "bg-primary" : "bg-primary/50",
								)}
								style={{ width: `${pct}%` }}
							/>
						</div>
						{isUnder && wordCount > 0 && (
							<p className="text-xs text-warning">Còn thiếu {activeTask.min_words - wordCount} từ</p>
						)}
						{!isUnder && wordCount > 0 && <p className="text-xs text-primary font-bold">Đạt yêu cầu ✓</p>}
					</div>
				</div>
			</div>

			{/* Task tabs + prev/next */}
			<div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-2.5">
				{activeIdx > 0 ? (
					<button
						type="button"
						onClick={handlePrev}
						className="flex items-center gap-1.5 rounded-(--radius-button) border-2 border-b-4 border-border bg-surface px-3 py-1.5 text-xs font-extrabold text-foreground transition-all active:translate-y-[2px] active:border-b-2 hover:border-primary/40"
					>
						<svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
							<path d="M10 3L5 8l5 5V3z" />
						</svg>
						Phần {activeIdx}
					</button>
				) : (
					<div className="w-24" />
				)}

				<div className="flex items-center gap-1.5">
					{tasksMeta.map((meta, i) => {
						const isActive = i === activeIdx
						const tabPct = meta.minWords > 0 ? Math.min(100, (meta.wordCount / meta.minWords) * 100) : 0
						return (
							<button
								key={sorted[i]?.id ?? i}
								type="button"
								onClick={() => setActiveIdx(i)}
								className={cn(
									"relative overflow-hidden rounded-(--radius-button) border-2 border-b-4 px-3 pb-2.5 pt-1.5 text-xs font-extrabold transition-all active:translate-y-[2px] active:border-b-2",
									isActive
										? "border-primary/70 bg-primary text-white"
										: "border-border bg-surface text-muted hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
								)}
							>
								<span className="inline-flex items-center gap-1.5">
									Phần {i + 1}
									<span className="opacity-80">· {meta.typeLabel}</span>
								</span>
								<span
									className={cn(
										"absolute inset-x-0 bottom-0 h-1 overflow-hidden",
										isActive ? "bg-white/20" : "bg-primary/10",
									)}
								>
									<span
										className={cn(
											"block h-full transition-[width] duration-300",
											isActive ? "bg-white" : "bg-primary/70",
										)}
										style={{ width: `${tabPct}%` }}
									/>
								</span>
							</button>
						)
					})}
				</div>

				{activeIdx < sorted.length - 1 ? (
					<button type="button" onClick={handleNext} className="btn btn-primary px-3 py-1.5 text-xs">
						Phần {activeIdx + 2}
						<svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
							<path d="M6 3l5 5-5 5V3z" />
						</svg>
					</button>
				) : (
					<div className="w-24" />
				)}
			</div>

			{/* Global footer */}
			<div className="z-40 flex h-14 shrink-0 items-center justify-between border-t border-border bg-card px-5">
				<div className="w-24">
					<p className="text-xs text-muted">
						{wordCount}/{activeTask.min_words} từ
					</p>
				</div>
				<p className="text-sm font-extrabold text-skill-writing">
					{footer.skillLabel}
					<span className="ml-1 text-xs font-normal text-muted">({footer.skillProgress})</span>
				</p>
				{footer.isLastSkill ? (
					<button
						type="button"
						onClick={footer.onSubmit}
						disabled={footer.isSubmitting}
						className="btn btn-primary disabled:opacity-60"
					>
						<svg
							viewBox="0 0 16 16"
							className="size-4"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<polyline points="2,8 6,12 14,4" />
						</svg>
						Nộp bài
					</button>
				) : (
					<button type="button" onClick={footer.onNext} className="btn btn-secondary">
						Phần tiếp
						<svg
							viewBox="0 0 16 16"
							className="size-4"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M6 3l5 5-5 5" />
						</svg>
					</button>
				)}
			</div>
		</div>
	)
}
