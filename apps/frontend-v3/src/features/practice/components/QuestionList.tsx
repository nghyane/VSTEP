import type { McqQuestion, SubmitResult } from "#/features/practice/types"
import { cn } from "#/lib/utils"

const LETTERS = ["A", "B", "C", "D"]

interface Props {
	questions: McqQuestion[]
	answers: Record<string, number>
	result: SubmitResult | null
	onSelect: (questionId: string, index: number) => void
}

export function QuestionList({ questions, answers, result, onSelect }: Props) {
	const resultMap = result ? Object.fromEntries(result.items.map((i) => [i.question_id, i])) : null

	return (
		<div className="space-y-6">
			{questions.map((q, qi) => {
				const selected = answers[q.id] ?? null
				const item = resultMap?.[q.id]

				return (
					<div key={q.id} className="space-y-3">
						<p className="text-sm font-bold text-foreground">
							<span className="text-primary mr-1.5">{qi + 1}.</span>
							{q.question}
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
							{q.options.map((opt, oi) => {
								const letter = LETTERS[oi]
								const isSelected = oi === selected
								const isCorrect = item && oi === item.correct_index
								const isWrong = item && isSelected && !item.is_correct

								let badgeStyle = "bg-background text-muted"
								let optionStyle = "border-border-light hover:border-border"

								if (isCorrect) {
									badgeStyle = "bg-primary text-primary-foreground"
									optionStyle = "border-primary bg-primary-tint"
								} else if (isWrong) {
									badgeStyle = "bg-destructive text-primary-foreground"
									optionStyle = "border-destructive bg-destructive-tint"
								} else if (isSelected && !result) {
									badgeStyle = "bg-primary text-primary-foreground"
									optionStyle = "border-primary bg-primary-tint"
								}

								return (
									<button
										key={opt}
										type="button"
										disabled={!!result}
										onClick={() => onSelect(q.id, oi)}
										className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-(--radius-button) border-2 text-left text-sm transition", optionStyle)}
									>
										<span className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0", badgeStyle)}>
											{letter}
										</span>
										<span className="text-foreground">{opt}</span>
									</button>
								)
							})}
						</div>
						{item?.explanation && (
							<p className="text-sm text-muted pl-9">{item.explanation}</p>
						)}
					</div>
				)
			})}
		</div>
	)
}

export function QuestionNav({ questions, answers, result }: Omit<Props, "onSelect">) {
	const resultMap = result ? Object.fromEntries(result.items.map((i) => [i.question_id, i])) : null

	return (
		<div className="flex flex-wrap justify-center gap-1.5 border-t border-border px-4 py-2.5">
			{questions.map((q, qi) => {
				const isAnswered = answers[q.id] !== undefined
				const item = resultMap?.[q.id]

				let style = "border-border bg-surface text-muted"
				if (item) {
					style = item.is_correct
						? "border-primary bg-primary-tint text-primary"
						: "border-destructive bg-destructive-tint text-destructive"
				} else if (isAnswered) {
					style = "border-primary bg-primary text-primary-foreground"
				}

				return (
					<a
						key={q.id}
						href={`#q-${qi}`}
						className={cn("w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition", style)}
					>
						{qi + 1}
					</a>
				)
			})}
		</div>
	)
}
