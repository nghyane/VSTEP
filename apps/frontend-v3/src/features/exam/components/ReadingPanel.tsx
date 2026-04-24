import { useCallback, useMemo, useState } from "react"
import { ScrollArea } from "#/components/ScrollArea"
import { MCQQuestion } from "#/features/exam/components/MCQQuestion"
import type { ExamVersionReadingPassage } from "#/features/exam/types"
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
	passages: ExamVersionReadingPassage[]
	mcqAnswers: Map<string, number>
	onAnswer: (itemId: string, selectedIndex: number) => void
	footer: FooterAction
}

export function ReadingPanel({ passages, mcqAnswers, onAnswer, footer }: Props) {
	const sorted = useMemo(() => [...passages].sort((a, b) => a.display_order - b.display_order), [passages])

	const [activeIdx, setActiveIdx] = useState(0)

	const activePassage = sorted[activeIdx]

	const passagesMeta = useMemo(
		() =>
			sorted.map((p) => {
				const answered = p.items.filter((it) => mcqAnswers.has(it.id)).length
				return { part: p.part, total: p.items.length, answered }
			}),
		[sorted, mcqAnswers],
	)

	const handlePrev = useCallback(() => setActiveIdx((i) => Math.max(0, i - 1)), [])
	const handleNext = useCallback(
		() => setActiveIdx((i) => Math.min(i + 1, sorted.length - 1)),
		[sorted.length],
	)

	const handleJump = useCallback((itemIndex: number) => {
		document
			.getElementById(`reading-item-${itemIndex}`)
			?.scrollIntoView({ behavior: "smooth", block: "center" })
	}, [])

	if (!activePassage) return null

	const activeMeta = passagesMeta[activeIdx]

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* Split layout: passage left | questions right */}
			<div className="flex flex-1 overflow-hidden">
				{/* Passage */}
				<ScrollArea className="w-1/2 border-r border-border">
					<div className="space-y-4 bg-background px-7 py-6">
						<div className="flex items-center gap-2">
							<span className="rounded-full border-2 border-b-4 border-skill-reading/30 bg-skill-reading/10 px-3 py-1 text-xs font-extrabold text-skill-reading">
								Phần {activePassage.part}
							</span>
							<span className="text-xs text-muted">{activePassage.duration_minutes} phút</span>
						</div>
						<h2 className="text-base font-bold text-foreground">{activePassage.title}</h2>
						<div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
							{activePassage.passage}
						</div>
					</div>
				</ScrollArea>

				{/* Questions */}
				<ScrollArea className="flex-1">
					<div className="space-y-6 bg-background px-6 py-6">
						{activePassage.items.map((item, idx) => (
							<div key={item.id} id={`reading-item-${idx}`}>
								<MCQQuestion
									item={item}
									index={idx}
									selectedIndex={mcqAnswers.get(item.id)}
									onSelect={onAnswer}
									skill="reading"
								/>
							</div>
						))}
					</div>
				</ScrollArea>
			</div>

			{/* Jump buttons */}
			<div className="flex flex-wrap justify-center gap-1.5 border-t-2 border-border/50 bg-card px-4 py-2.5">
				{activePassage.items.map((item, i) => {
					const isAnswered = mcqAnswers.has(item.id)
					return (
						<button
							key={item.id}
							type="button"
							onClick={() => handleJump(i)}
							className={cn(
								"flex size-8 items-center justify-center rounded-(--radius-button) border-2 border-b-4 text-xs font-extrabold transition-all active:translate-y-[2px] active:border-b-2",
								isAnswered
									? "border-primary/70 bg-primary text-white"
									: "border-border bg-surface text-muted hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
							)}
						>
							{i + 1}
						</button>
					)
				})}
			</div>

			{/* Passage tabs + prev/next */}
			<div className="flex items-center justify-between gap-3 border-t-2 border-border/50 bg-card px-4 py-2.5">
				{/* Prev */}
				{activeIdx > 0 ? (
					<button
						type="button"
						onClick={handlePrev}
						className="flex items-center gap-1.5 rounded-(--radius-button) border-2 border-b-4 border-border bg-surface px-3 py-1.5 text-xs font-extrabold text-foreground transition-all active:translate-y-[2px] active:border-b-2 hover:border-primary/40"
					>
						<svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
							<path d="M10 3L5 8l5 5V3z" />
						</svg>
						Đoạn {activeIdx}
					</button>
				) : (
					<div className="w-24" />
				)}

				{/* Passage tabs */}
				<div className="flex items-center gap-1.5">
					{passagesMeta.map((meta, i) => {
						const isActive = i === activeIdx
						const pct = meta.total > 0 ? (meta.answered / meta.total) * 100 : 0
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
									Đoạn {i + 1}
									<span className="opacity-80">
										{meta.answered}/{meta.total}
									</span>
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
										style={{ width: `${pct}%` }}
									/>
								</span>
							</button>
						)
					})}
				</div>

				{/* Next */}
				{activeIdx < sorted.length - 1 ? (
					<button type="button" onClick={handleNext} className="btn btn-primary px-3 py-1.5 text-xs">
						Đoạn {activeIdx + 2}
						<svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
							<path d="M6 3l5 5-5 5V3z" />
						</svg>
					</button>
				) : (
					<div className="w-24" />
				)}
			</div>

			{/* Global footer — skill indicator + submit/next */}
			<div className="z-40 flex h-14 shrink-0 items-center justify-between border-t-2 border-border/50 bg-card px-5">
				<div className="w-24">
					{activeMeta && (
						<p className="text-xs text-muted">
							{activeMeta.answered}/{activeMeta.total} câu
						</p>
					)}
				</div>
				<p className="text-sm font-extrabold text-skill-reading">
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
