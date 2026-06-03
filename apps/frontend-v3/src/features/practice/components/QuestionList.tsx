import { Icon } from "#/components/Icon"
import type { McqQuestion, SubmitResult } from "#/features/practice/types"
import { cn } from "#/lib/utils"

const LETTERS = ["A", "B", "C", "D"]

interface Props {
	questions: McqQuestion[]
	answers: Record<string, number>
	result: SubmitResult | null
	onSelect: (questionId: string, index: number) => void
	accentColor?: string
	visibleQuestionIndex?: number
	revealAnswers?: boolean
}

type Styles = { badge: string; option: string; accent?: string }
type AnswerItem = Pick<SubmitResult["items"][0], "correct_index" | "explanation" | "is_correct">

function optionStyles(
	selected: number | undefined,
	oi: number,
	item: AnswerItem | undefined,
	color?: string,
): Styles {
	if (item) {
		if (oi === item.correct_index)
			return color
				? { badge: "text-primary-foreground", option: "", accent: color }
				: {
						badge: "bg-primary text-primary-foreground",
						option: "border-primary border-b-primary bg-primary-tint",
					}
		if (oi === selected && !item.is_correct)
			return {
				badge: "bg-destructive text-primary-foreground",
				option: "border-destructive border-b-destructive bg-destructive-tint",
			}
		return { badge: "bg-background text-subtle", option: "border-border bg-surface" }
	}
	if (oi === selected)
		return color
			? { badge: "text-primary-foreground", option: "", accent: color }
			: {
					badge: "bg-primary text-primary-foreground",
					option: "border-primary border-b-primary bg-primary-tint",
				}
	return { badge: "bg-background text-muted", option: "border-border bg-surface hover:bg-background" }
}

function tint(color: string) {
	return `color-mix(in oklch, ${color} 10%, transparent)`
}

export function QuestionList({
	questions,
	answers,
	result,
	onSelect,
	accentColor,
	visibleQuestionIndex,
	revealAnswers,
}: Props) {
	const resultMap = result ? new Map(result.items.map((i) => [i.question_id, i])) : null
	const visibleQuestions =
		result || revealAnswers || visibleQuestionIndex === undefined
			? questions.map((question, index) => ({ question, index }))
			: [{ question: questions[visibleQuestionIndex], index: visibleQuestionIndex }]

	return (
		<div className="space-y-8">
			{visibleQuestions.map(({ question: q, index: qi }) => {
				const selected = answers[q.id]
				const resultItem = resultMap?.get(q.id)
				const revealItem =
					revealAnswers && q.correct_index !== undefined
						? {
								correct_index: q.correct_index,
								explanation: q.explanation ?? "",
								is_correct: true,
							}
						: undefined
				const item = resultItem ?? revealItem

				return (
					<div key={q.id} id={`q-${qi}`} className="min-w-0">
						<p className="mb-4 min-w-0 text-base font-bold leading-relaxed text-foreground break-words">
							<span className="mr-2" style={accentColor ? { color: accentColor } : undefined}>
								{qi + 1}.
							</span>
							{q.question}
						</p>
						<div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] gap-3">
							{q.options.map((opt, oi) => {
								const s = optionStyles(selected, oi, item, accentColor)
								return (
									<button
										key={opt}
										type="button"
										disabled={!!result}
										onClick={() => onSelect(q.id, oi)}
										className={cn(
											"flex min-h-16 items-start gap-3 rounded-(--radius-card) border-2 border-b-4 px-4 py-3 text-left transition",
											s.option,
										)}
										style={s.accent ? { borderColor: s.accent, backgroundColor: tint(s.accent) } : undefined}
									>
										<span
											className={cn(
												"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
												s.badge,
											)}
											style={s.accent ? { backgroundColor: s.accent } : undefined}
										>
											{LETTERS[oi]}
										</span>
										<span className="min-w-0 flex-1 whitespace-normal text-sm font-bold leading-relaxed text-foreground break-words">
											{opt}
										</span>
									</button>
								)
							})}
						</div>
						{item && (
							<ExplanationBlock
								item={item}
								question={q}
								accentColor={accentColor}
								forceShowAnswer={revealAnswers}
							/>
						)}
					</div>
				)
			})}
		</div>
	)
}

function ExplanationBlock({
	item,
	question,
	accentColor,
	forceShowAnswer,
}: {
	item: AnswerItem
	question: McqQuestion
	accentColor?: string
	forceShowAnswer?: boolean
}) {
	const correct = item.is_correct
	const isAnswerReveal = !!forceShowAnswer
	const c = accentColor ?? "var(--color-primary)"

	return (
		<div
			className={cn(
				"mt-3 rounded-xl border-2 p-4",
				!correct && !isAnswerReveal && "border-destructive/30 bg-destructive-tint/50",
			)}
			style={
				correct || isAnswerReveal
					? {
							borderColor: `color-mix(in oklch, ${c} 30%, transparent)`,
							backgroundColor: `color-mix(in oklch, ${c} 5%, transparent)`,
						}
					: undefined
			}
		>
			<div className="flex items-center gap-2 mb-2">
				<Icon
					name={correct || isAnswerReveal ? "check" : "close"}
					size="xs"
					className={correct || isAnswerReveal ? undefined : "text-destructive"}
					style={(correct || isAnswerReveal) && accentColor ? { color: accentColor } : undefined}
				/>
				<span
					className={cn("text-sm font-bold", !correct && !isAnswerReveal && "text-destructive")}
					style={(correct || isAnswerReveal) && accentColor ? { color: accentColor } : undefined}
				>
					{isAnswerReveal ? "Đáp án đúng" : correct ? "Chính xác!" : "Chưa đúng"}
				</span>
			</div>
			{(!correct || forceShowAnswer) && (
				<p className="text-sm text-foreground mb-2">
					<span className="text-muted">Đáp án đúng: </span>
					<span className="font-bold">
						{LETTERS[item.correct_index]}. {question.options[item.correct_index]}
					</span>
				</p>
			)}
			{item.explanation && <p className="text-sm text-subtle leading-relaxed">{item.explanation}</p>}
		</div>
	)
}
