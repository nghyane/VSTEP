import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "motion/react"
import { useCallback, useMemo, useState } from "react"
import { Button } from "#/components/ui/button"
import type { MCQAnswerMap, MockReadingPassage } from "#/lib/mock/exam-session"
import { cn } from "#/lib/utils"

const LETTERS = "ABCD"

// ─── MCQ item ─────────────────────────────────────────────────────────────────

function MCQItem({
	index,
	stem,
	options,
	selected,
	onSelect,
}: {
	index: number
	stem: string
	options: string[]
	selected: string | null
	onSelect: (letter: string) => void
}) {
	return (
		<div className="space-y-2">
			<p className="text-sm font-medium">
				Câu {index + 1}. {stem}
			</p>
			<div className="grid gap-2 sm:grid-cols-2">
				{options.map((opt, oi) => {
					const letter = LETTERS[oi] ?? String(oi + 1)
					const isSelected = selected === letter
					return (
				<motion.button
					key={`${index}-${oi}`}
					type="button"
					onClick={() => onSelect(letter)}
					whileTap={{ scale: 0.97 }}
					transition={{ type: "spring", stiffness: 450, damping: 25 }}
					className={cn(
						"flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
						isSelected
							? "border-primary border-b-2 border-b-primary/60 bg-primary/5 shadow-sm"
							: "border-border hover:border-primary/40 hover:bg-muted/30",
					)}
				>
					<span
						className={cn(
							"flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
							isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
						)}
					>
						{letter}
					</span>
					<span>{opt}</span>
				</motion.button>
					)
				})}
			</div>
		</div>
	)
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
	passages: MockReadingPassage[]
	answers: MCQAnswerMap
	onAnswer: (passageId: string, itemIndex: number, letter: string) => void
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function ReadingExamPanel({ passages, answers, onAnswer }: Props) {
	const sorted = useMemo(() => [...passages].sort((a, b) => a.part - b.part), [passages])

	const [activeIdx, setActiveIdx] = useState(0)
	const [mobileTab, setMobileTab] = useState<"passage" | "questions">("passage")

	const activePassage = sorted[activeIdx]
	const currentAnswers = activePassage ? (answers.get(activePassage.id) ?? {}) : {}

	const passagesMeta = useMemo(
		() =>
			sorted.map((p) => {
				const a = answers.get(p.id) ?? {}
				return { total: p.items.length, answered: Object.keys(a).length }
			}),
		[sorted, answers],
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

	const questionsContent = (
		<div className="space-y-6">
			{activePassage.items.map((item, idx) => (
				<div key={`${activePassage.id}-${idx}`} id={`reading-item-${idx}`}>
					<MCQItem
						index={idx}
						stem={item.stem}
						options={item.options}
						selected={currentAnswers[String(idx + 1)] ?? null}
						onSelect={(letter) => onAnswer(activePassage.id, idx, letter)}
					/>
				</div>
			))}
		</div>
	)

	const passageContent = (
		<div className="space-y-4">
			<h3 className="text-lg font-bold">{activePassage.title}</h3>
			<div className="prose prose-sm whitespace-pre-line leading-relaxed text-foreground">
				{activePassage.passage}
			</div>
		</div>
	)

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
		{/* Desktop: split layout */}
		<div className="hidden flex-1 overflow-hidden lg:flex">
			<div className="w-1/2 overflow-y-auto border-r bg-muted/10 p-6">{passageContent}</div>
			<div className="flex-1 overflow-y-auto p-6">{questionsContent}</div>
		</div>

			{/* Mobile: tabbed layout */}
			<div className="flex flex-1 flex-col overflow-hidden lg:hidden">
				<div className="flex shrink-0 border-b">
					{(["passage", "questions"] as const).map((tab) => (
						<button
							key={tab}
							type="button"
							onClick={() => setMobileTab(tab)}
							className={cn(
								"flex-1 py-2.5 text-center text-sm font-medium transition-colors",
								mobileTab === tab
									? "border-b-2 border-primary text-primary"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{tab === "passage" ? "Đoạn văn" : "Trả lời"}
						</button>
					))}
				</div>
				<div className="flex-1 overflow-y-auto p-4">
					{mobileTab === "passage" ? passageContent : questionsContent}
				</div>
			</div>

		{/* Question number buttons */}
		<div className="flex flex-wrap justify-center gap-1.5 border-t px-4 py-2.5">
			{activePassage.items.map((_, i) => {
				const isAnswered = currentAnswers[String(i + 1)] != null
				return (
					<motion.button
						key={i}
						type="button"
						onClick={() => handleJump(i)}
						whileTap={{ scale: 0.88 }}
						transition={{ type: "spring", stiffness: 500, damping: 30 }}
						className={cn(
							"flex size-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
							isAnswered
								? "border-primary border-b-2 border-b-primary/60 bg-primary text-primary-foreground shadow-sm"
								: "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-accent",
						)}
					>
						{i + 1}
					</motion.button>
				)
			})}
		</div>

		{/* Passage tabs + prev/next */}
		<div className="flex items-center justify-between border-t bg-card px-4 py-2.5">
				{activeIdx > 0 ? (
					<Button size="sm" variant="outline" onClick={handlePrev}>
						<ChevronLeft className="size-4" />
						Passage {activeIdx}
					</Button>
				) : (
					<div className="w-24" />
				)}

				<div className="flex items-center gap-1.5">
					{passagesMeta.map((meta, i) => {
						const isActive = i === activeIdx
						const pct = meta.total > 0 ? (meta.answered / meta.total) * 100 : 0
						return (
							<button
								key={i}
								type="button"
								onClick={() => setActiveIdx(i)}
								className={cn(
									"relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 pb-2.5 pt-1.5 text-xs font-medium transition-colors",
									isActive
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:bg-muted/80",
								)}
							>
								Passage {i + 1}
								<span className="opacity-80">
									{meta.answered}/{meta.total}
								</span>
								<span
									className={cn(
										"absolute inset-x-1 bottom-0.5 h-0.5 overflow-hidden rounded-full",
										isActive ? "bg-primary-foreground/30" : "bg-border",
									)}
								>
									<span
										className={cn(
											"block h-full rounded-full transition-[width]",
											isActive ? "bg-primary-foreground" : "bg-muted-foreground/50",
										)}
										style={{ width: `${pct}%` }}
									/>
								</span>
							</button>
						)
					})}
				</div>

				{activeIdx < sorted.length - 1 ? (
					<Button size="sm" onClick={handleNext}>
						Passage {activeIdx + 2}
						<ChevronRight className="size-4" />
					</Button>
				) : (
					<div className="w-24" />
				)}
			</div>
		</div>
	)
}
