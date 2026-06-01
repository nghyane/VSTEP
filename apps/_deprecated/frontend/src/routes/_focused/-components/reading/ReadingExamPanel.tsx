import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getObjectiveAnswer } from "@/routes/_learner/exams/-components/questions/useExamAnswers"
import type {
	ExamSessionDetail,
	QuestionContent,
	ReadingContent,
	ReadingGapFillContent,
	ReadingMatchingContent,
	ReadingTNGContent,
	SubmissionAnswer,
} from "@/types/api"

// --- Type guards ---

function isReadingPassageContent(c: QuestionContent): c is ReadingContent | ReadingTNGContent {
	return "passage" in c && "items" in c
}

function isReadingGapFillContent(c: QuestionContent): c is ReadingGapFillContent {
	return "textWithGaps" in c
}

function isReadingMatchingContent(c: QuestionContent): c is ReadingMatchingContent {
	return "paragraphs" in c && "headings" in c
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

// --- Helpers ---

function getItemCount(content: QuestionContent): number {
	if (isReadingPassageContent(content)) return content.items.length
	if (isReadingGapFillContent(content)) return content.items.length
	if (isReadingMatchingContent(content)) return content.paragraphs.length
	return 0
}

function getItemStem(content: QuestionContent, index: number): string {
	if (isReadingPassageContent(content)) return content.items[index]?.stem ?? ""
	if (isReadingGapFillContent(content)) return `Gap ${index + 1}`
	if (isReadingMatchingContent(content)) {
		const para = content.paragraphs[index]
		return para ? `${para.label}. ${para.text}` : ""
	}
	return ""
}

function getItemOptions(content: QuestionContent, index: number): string[] {
	if (isReadingPassageContent(content)) return content.items[index]?.options ?? []
	if (isReadingGapFillContent(content)) return content.items[index]?.options ?? []
	if (isReadingMatchingContent(content)) return content.headings
	return []
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

// --- Passage renderer ---

function PassageContent({ content }: { content: QuestionContent }) {
	const title = "title" in content ? (content as { title?: string }).title : undefined

	return (
		<div className="space-y-4">
			{title && <h3 className="text-lg font-bold">{title}</h3>}

			{isReadingPassageContent(content) && (
				<div className="prose prose-sm whitespace-pre-line">{content.passage}</div>
			)}

			{isReadingGapFillContent(content) && (
				<div className="prose prose-sm whitespace-pre-line">{content.textWithGaps}</div>
			)}

			{isReadingMatchingContent(content) && (
				<div className="prose prose-sm space-y-4">
					{content.paragraphs.map((para) => (
						<div key={para.label}>
							<span className="font-semibold">{para.label}.</span>{" "}
							<span className="whitespace-pre-line">{para.text}</span>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

// --- Main Panel ---

export function ReadingExamPanel({ questions, answers, onSelectMCQ }: ReadingExamPanelProps) {
	// Each question = one passage, sorted by part
	const passages = useMemo(() => [...questions].sort((a, b) => a.part - b.part), [questions])

	const [activePassageIdx, setActivePassageIdx] = useState(0)
	const [mobileTab, setMobileTab] = useState<"passage" | "questions">("passage")

	const activeQuestion = passages[activePassageIdx]
	const content = activeQuestion?.content

	// Current passage's saved answers
	const currentAnswers = useMemo(
		() => getObjectiveAnswer(answers, activeQuestion?.id ?? ""),
		[answers, activeQuestion?.id],
	)

	// Per-passage metadata for tabs
	const passagesMeta = useMemo(
		() =>
			passages.map((q) => {
				const total = getItemCount(q.content)
				const obj = getObjectiveAnswer(answers, q.id)
				const answered = Object.keys(obj).length
				return { part: q.part, total, answered }
			}),
		[passages, answers],
	)

	const itemCount = content ? getItemCount(content) : 0

	const handlePrevPassage = useCallback(() => {
		setActivePassageIdx((i) => Math.max(0, i - 1))
	}, [])

	const handleNextPassage = useCallback(() => {
		setActivePassageIdx((i) => Math.min(i + 1, passages.length - 1))
	}, [passages.length])

	const handleJumpToItem = useCallback((itemIndex: number) => {
		document
			.getElementById(`reading-item-${itemIndex}`)
			?.scrollIntoView({ behavior: "smooth", block: "center" })
	}, [])

	if (!activeQuestion || !content) return null

	// --- Question items renderer (shared between desktop/mobile) ---
	const questionsContent = (
		<div className="space-y-6">
			{Array.from({ length: itemCount }, (_, index) => (
				<div key={`${activeQuestion.id}-${index}`} id={`reading-item-${index}`}>
					<ReadingMCQItem
						index={index}
						stem={getItemStem(content, index)}
						options={getItemOptions(content, index)}
						selectedOption={currentAnswers[String(index + 1)] ?? null}
						onSelect={(optionIndex) =>
							onSelectMCQ(activeQuestion.id, currentAnswers, index, optionIndex)
						}
					/>
				</div>
			))}
		</div>
	)

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* ---- Desktop: split layout (passage left, questions right) ---- */}
			<div className="hidden flex-1 overflow-hidden lg:flex">
				{/* Left: Passage */}
				<div className="w-1/2 overflow-y-auto border-r bg-muted/5 p-6">
					<PassageContent content={content} />
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
					{mobileTab === "passage" ? <PassageContent content={content} /> : questionsContent}
				</div>
			</div>

			{/* ---- Question numbers row ---- */}
			<div className="flex flex-wrap justify-center gap-1.5 border-t px-4 py-2.5">
				{Array.from({ length: itemCount }, (_, i) => {
					const isAnswered = currentAnswers[String(i + 1)] != null
					return (
						<button
							key={i}
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
				{activePassageIdx < passages.length - 1 ? (
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
