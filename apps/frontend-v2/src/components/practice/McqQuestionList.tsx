// McqQuestionList — tất cả câu của 1 đề hiện cùng lúc, scroll trả lời.
// Dùng chung cho Listening + Reading session.
// Sau submit: câu sai hiện giải thích luôn, câu đúng có nút toggle.

import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { ChatGptIcon } from "#/components/common/ChatGptIcon"
import { askExplainQuestion } from "#/lib/ai-chat/store"
import { cn } from "#/lib/utils"

export interface McqItem {
	readonly id: string
	readonly question: string
	readonly options: readonly [string, string, string, string]
	readonly correctIndex: 0 | 1 | 2 | 3
	readonly explanation: string
}

interface Props {
	items: readonly McqItem[]
	selectedAnswers: Record<number, number>
	submitted: boolean
	onSelect: (itemIndex: number, optionIndex: number) => void
}

export function McqQuestionList({
	items,
	selectedAnswers,
	submitted,
	onSelect,
}: Props) {
	return (
		<div className="space-y-6">
			{items.map((item, index) => (
				<QuestionBlock
					key={item.id}
					item={item}
					index={index}
					selected={selectedAnswers[index] ?? null}
					submitted={submitted}
					onSelect={(optIdx) => onSelect(index, optIdx)}
				/>
			))}
		</div>
	)
}

interface QuestionBlockProps {
	item: McqItem
	index: number
	selected: number | null
	submitted: boolean
	onSelect: (optionIndex: number) => void
}

function QuestionBlock({
	item,
	index,
	selected,
	submitted,
	onSelect,
}: QuestionBlockProps) {
	const isWrong = submitted && selected !== null && selected !== item.correctIndex

	return (
		<div id={`mcq-item-${index}`} className="space-y-3">
			<div className="flex items-start justify-between gap-3">
				<p className="min-w-0 flex-1 text-sm font-medium">
					<span className="mr-1.5 text-primary">{index + 1}.</span>
					{item.question}
				</p>
				<AskAiButton
					onClick={() =>
						askExplainQuestion({
							question: item.question,
							options: item.options,
							correctIndex: item.correctIndex,
							userIndex: selected,
							submitted,
						})
					}
				/>
			</div>
			<div className="grid gap-2 sm:grid-cols-2">
				{item.options.map((option, optIdx) => (
					<OptionButton
						key={option}
						option={option}
						letter={String.fromCharCode(65 + optIdx)}
						isSelected={selected === optIdx}
						isCorrectOption={submitted && optIdx === item.correctIndex}
						isWrongSelected={submitted && selected === optIdx && optIdx !== item.correctIndex}
						disabled={submitted}
						onClick={() => onSelect(optIdx)}
					/>
				))}
			</div>
			{submitted && isWrong && <Explanation text={item.explanation} variant="wrong" />}
			{submitted && !isWrong && <CollapsibleExplanation text={item.explanation} />}
		</div>
	)
}

function AskAiButton({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label="Hỏi trợ lý AI về câu này"
			className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		>
			<ChatGptIcon className="size-4" />
		</button>
	)
}

interface OptionButtonProps {
	option: string
	letter: string
	isSelected: boolean
	isCorrectOption: boolean
	isWrongSelected: boolean
	disabled: boolean
	onClick: () => void
}

function OptionButton(props: OptionButtonProps) {
	const { option, letter, isSelected, isCorrectOption, isWrongSelected, disabled, onClick } = props
	const baseClass = "border-border hover:bg-muted/50"
	const selectedClass = "border-primary bg-primary/5 ring-1 ring-primary/20"
	const correctClass = "border-success bg-success/10 text-foreground"
	const wrongClass = "border-destructive bg-destructive/10 text-foreground"

	const optionClass = isCorrectOption
		? correctClass
		: isWrongSelected
			? wrongClass
			: isSelected && !disabled
				? selectedClass
				: baseClass

	const letterBgClass = isCorrectOption
		? "bg-success text-white"
		: isWrongSelected
			? "bg-destructive text-white"
			: isSelected
				? "bg-primary text-primary-foreground"
				: "bg-muted text-muted-foreground"

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-all",
				optionClass,
				disabled && !isCorrectOption && !isWrongSelected && "cursor-not-allowed opacity-80",
			)}
		>
			<span
				className={cn(
					"flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
					letterBgClass,
				)}
			>
				{letter}
			</span>
			<span>{option}</span>
		</button>
	)
}

function Explanation({ text, variant }: { text: string; variant: "wrong" | "correct" }) {
	const isWrong = variant === "wrong"
	return (
		<div
			className={cn(
				"rounded-lg border px-4 py-3",
				isWrong
					? "border-destructive/20 bg-destructive/5"
					: "border-primary/20 bg-primary/5",
			)}
		>
			<p
				className={cn(
					"mb-1 text-[11px] font-semibold uppercase tracking-wider",
					isWrong ? "text-destructive" : "text-primary",
				)}
			>
				Giải thích
			</p>
			<p className="text-sm leading-relaxed text-foreground/90">{text}</p>
		</div>
	)
}

function CollapsibleExplanation({ text }: { text: string }) {
	const [open, setOpen] = useState(false)
	return (
		<div>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
			>
				<ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
				{open ? "Ẩn giải thích" : "Xem giải thích"}
			</button>
			{open && (
				<div className="mt-2">
					<Explanation text={text} variant="correct" />
				</div>
			)}
		</div>
	)
}
