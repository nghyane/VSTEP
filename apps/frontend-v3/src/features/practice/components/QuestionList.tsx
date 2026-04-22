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
}

type Styles = { badge: string; option: string; accent?: string }

function optionStyles(
	selected: number | undefined,
	oi: number,
	item: SubmitResult["items"][0] | undefined,
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

export function QuestionList({ questions, answers, result, onSelect, accentColor }: Props) {
	const resultMap = result ? new Map(result.items.map((i) => [i.question_id, i])) : null

	return (
		<div className="space-y-8">
			{questions.map((q, qi) => {
				const selected = answers[q.id]
				const item = resultMap?.get(q.id)

				return (
					<div key={q.id} id={`q-${qi}`}>
						<p className="font-bold text-base text-foreground mb-3">
							<span className="mr-2" style={accentColor ? { color: accentColor } : undefined}>
								{qi + 1}.
							</span>
							{q.question}
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{q.options.map((opt, oi) => {
								const s = optionStyles(selected, oi, item, accentColor)
								return (
									<button
										key={opt}
										type="button"
										disabled={!!result}
										onClick={() => onSelect(q.id, oi)}
										className={cn(
											"flex items-center gap-3 px-4 py-3 rounded-(--radius-card) border-2 border-b-4 text-left transition",
											s.option,
										)}
										style={s.accent ? { borderColor: s.accent, backgroundColor: tint(s.accent) } : undefined}
									>
										<span
											className={cn(
												"w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
												s.badge,
											)}
											style={s.accent ? { backgroundColor: s.accent } : undefined}
										>
											{LETTERS[oi]}
										</span>
										<span className="text-sm font-bold text-foreground">{opt}</span>
									</button>
								)
							})}
						</div>
						{item && <ExplanationBlock item={item} question={q} accentColor={accentColor} />}
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
}: {
	item: SubmitResult["items"][0]
	question: McqQuestion
	accentColor?: string
}) {
	const correct = item.is_correct
	const c = accentColor ?? "var(--color-primary)"

	return (
		<div
			className={cn(
				"mt-3 rounded-xl border-2 p-4",
				!correct && "border-destructive/30 bg-destructive-tint/50",
			)}
			style={
				correct
					? {
							borderColor: `color-mix(in oklch, ${c} 30%, transparent)`,
							backgroundColor: `color-mix(in oklch, ${c} 5%, transparent)`,
						}
					: undefined
			}
		>
			<div className="flex items-center gap-2 mb-2">
				<Icon
					name={correct ? "check" : "close"}
					size="xs"
					className={correct ? undefined : "text-destructive"}
					style={correct && accentColor ? { color: accentColor } : undefined}
				/>
				<span
					className={cn("text-sm font-bold", !correct && "text-destructive")}
					style={correct && accentColor ? { color: accentColor } : undefined}
				>
					{correct ? "Chính xác!" : "Chưa đúng"}
				</span>
			</div>
			{!correct && (
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
