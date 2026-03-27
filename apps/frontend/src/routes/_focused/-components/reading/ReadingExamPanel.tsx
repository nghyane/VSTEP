import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getObjectiveAnswer } from "@/routes/_learner/exams/-components/questions/useExamAnswers"
import type { ExamSessionDetail, SubmissionAnswer } from "@/types/api"

// --- Helpers ---

function normalizeOptions(options: unknown): string[] {
	if (Array.isArray(options)) return options
	if (typeof options === "object" && options !== null) {
		return Object.keys(options)
			.sort()
			.map((k) => (options as Record<string, string>)[k])
	}
	return []
}

// --- Types ---

interface VirtualSectionItem {
	questionId: string
	stem: string
	options: string[]
}

interface VirtualSection {
	part: number
	passage: string
	title?: string
	items: VirtualSectionItem[]
}

// --- Constants ---

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

// --- Props ---

interface ReadingExamPanelProps {
	questions: ExamSessionDetail["questions"]
	answers: Map<string, SubmissionAnswer>
	onSelectMCQ: (
		qId: string,
		current: Record<string, string>,
		itemIdx: number,
		optIdx: number,
	) => void
}

// --- MCQ Item (2-column grid) ---

function ReadingMCQItem({
	index,
	stem,
	options,
	selectedOption,
	onSelect,
}: {
	index: number
	stem: string
	options: string[]
	selectedOption: string | null
	onSelect: (optionIndex: number) => void
}) {
	return (
		<div className="space-y-2">
			<p className="text-sm font-medium">
				Câu {index + 1}. {stem}
			</p>
			<div className="grid gap-2 sm:grid-cols-2">
				{options.map((opt, oi) => {
					const letter = LETTERS[oi] ?? String(oi + 1)
					const isSelected = selectedOption === letter
					return (
						<button
							key={`${index}-${oi}`}
							type="button"
							onClick={() => onSelect(oi)}
							className={cn(
								"flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-all",
								isSelected
									? "border-primary bg-primary/5 ring-1 ring-primary/20"
									: "border-border hover:border-primary/40",
							)}
						>
							<span
								className={cn(
									"flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
									isSelected
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground",
								)}
							>
								{letter}
							</span>
							<span>{opt}</span>
						</button>
					)
				})}
			</div>
		</div>
	)
}


// --- Main Panel ---

export function ReadingExamPanel({ questions, answers, onSelectMCQ }: ReadingExamPanelProps) {
	// Group questions by part into virtual sections
	const sections = useMemo(() => {
		const sorted = [...questions].sort((a, b) => a.part - b.part)
		const grouped = new Map<number, VirtualSection>()
		for (const q of sorted) {
			const raw = q.content as unknown as Record<string, unknown>
			if (!grouped.has(q.part)) {
				grouped.set(q.part, {
					part: q.part,
					passage: (raw.passage as string) ?? "",
					title: (raw.title as string) ?? undefined,
					items: [],
				})
			}
			grouped.get(q.part)!.items.push({
				questionId: q.id,
				stem: (raw.stem as string) ?? "",
				options: normalizeOptions(raw.options),
			})
		}
		return [...grouped.values()]
	}, [questions])

	const [activePassageIdx, setActivePassageIdx] = useState(0)
	const [mobileTab, setMobileTab] = useState<"passage" | "questions">("passage")

	const activeSection = sections[activePassageIdx]

	// Per-section metadata for tabs
	const passagesMeta = useMemo(
		() =>
			sections.map((section) => {
				const total = section.items.length
				let answered = 0
				for (const item of section.items) {
					if (getObjectiveAnswer(answers, item.questionId)["1"] != null) answered++
				}
				return { part: section.part, total, answered }
			}),
		[sections, answers],
	)


	const handlePrevPassage = useCallback(() => {
		setActivePassageIdx((i) => Math.max(0, i - 1))
	}, [])

	const handleNextPassage = useCallback(() => {
		setActivePassageIdx((i) => Math.min(i + 1, sections.length - 1))
	}, [sections.length])

	const handleJumpToItem = useCallback((itemIndex: number) => {
		document
			.getElementById(`reading-item-${itemIndex}`)
			?.scrollIntoView({ behavior: "smooth", block: "center" })
	}, [])

	if (!activeSection) return null

	// --- Question items renderer (shared between desktop/mobile) ---
	const questionsContent = (
		<div className="space-y-6">
			{activeSection.items.map((item, index) => {
				const itemAnswer = getObjectiveAnswer(answers, item.questionId)
				return (
					<div key={item.questionId} id={`reading-item-${index}`}>
						<ReadingMCQItem
							index={index}
							stem={item.stem}
							options={item.options}
							selectedOption={itemAnswer["1"] ?? null}
							onSelect={(optionIndex) =>
								onSelectMCQ(item.questionId, itemAnswer, 0, optionIndex)
							}
						/>
					</div>
				)
			})}
		</div>
	)

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* ---- Desktop: split layout (passage left, questions right) ---- */}
			<div className="hidden flex-1 overflow-hidden lg:flex">
				{/* Left: Passage */}
				<div className="w-1/2 overflow-y-auto border-r bg-muted/5 p-6">
					<div className="space-y-4">
						{activeSection.title && <h3 className="text-lg font-bold">{activeSection.title}</h3>}
						{activeSection.passage && (
							<div className="prose prose-sm whitespace-pre-line">{activeSection.passage}</div>
						)}
					</div>
				</div>
				{/* Right: Questions */}
				<div className="flex-1 overflow-y-auto p-6">{questionsContent}</div>
			</div>

			{/* ---- Mobile: tabbed layout ---- */}
			<div className="flex flex-1 flex-col overflow-hidden lg:hidden">
				<div className="flex shrink-0 border-b">
					<button
						type="button"
						onClick={() => setMobileTab("passage")}
						className={cn(
							"flex-1 py-2.5 text-center text-sm font-medium transition-colors",
							mobileTab === "passage"
								? "border-b-2 border-primary text-primary"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						Đoạn văn
					</button>
					<button
						type="button"
						onClick={() => setMobileTab("questions")}
						className={cn(
							"flex-1 py-2.5 text-center text-sm font-medium transition-colors",
							mobileTab === "questions"
								? "border-b-2 border-primary text-primary"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						Trả lời
					</button>
				</div>
				<div className="flex-1 overflow-y-auto p-4">
					{mobileTab === "passage" ? (
						<div className="space-y-4">
							{activeSection.title && <h3 className="text-lg font-bold">{activeSection.title}</h3>}
							{activeSection.passage && (
								<div className="prose prose-sm whitespace-pre-line">{activeSection.passage}</div>
							)}
						</div>
					) : questionsContent}
				</div>
			</div>

			{/* ---- Question numbers row ---- */}
			<div className="flex flex-wrap justify-center gap-1.5 border-t px-4 py-2.5">
				{activeSection.items.map((item, i) => {
					const isAnswered = getObjectiveAnswer(answers, item.questionId)["1"] != null
					return (
						<button
							key={item.questionId}
							type="button"
							onClick={() => handleJumpToItem(i)}
							className={cn(
								"flex size-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
								isAnswered
									? "border-primary bg-primary text-primary-foreground"
									: "border-border bg-background text-muted-foreground hover:bg-accent",
							)}
						>
							{i + 1}
						</button>
					)
				})}
			</div>

			{/* ---- Passage tabs + prev/next buttons ---- */}
			<div className="flex items-center justify-between border-t bg-muted/5 px-4 py-2.5">
				{/* Left: prev passage button */}
				{activePassageIdx > 0 ? (
					<Button size="sm" variant="outline" onClick={handlePrevPassage}>
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						Passage {activePassageIdx}
					</Button>
				) : (
					<div className="w-24" />
				)}

				{/* Center: passage tabs with progress */}
				<div className="flex items-center gap-1.5">
					{passagesMeta.map((meta, i) => {
						const isActive = i === activePassageIdx
						const pct = meta.total > 0 ? (meta.answered / meta.total) * 100 : 0
						return (
							<button
								key={i}
								type="button"
								onClick={() => setActivePassageIdx(i)}
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
								{/* Mini progress bar */}
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

				{/* Right: next passage button */}
				{activePassageIdx < sections.length - 1 ? (
					<Button size="sm" onClick={handleNextPassage}>
						Passage {activePassageIdx + 2}
						<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
					</Button>
				) : (
					<div className="w-24" />
				)}
			</div>
		</div>
	)
}
