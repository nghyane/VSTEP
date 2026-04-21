import type { McqQuestion, SubmitResult } from "#/features/practice/types"
import { cn } from "#/lib/utils"

const LETTERS = ["A", "B", "C", "D"]

interface Props {
	questions: McqQuestion[]
	answers: Record<string, number>
	result: SubmitResult | null
	onSelect: (questionId: string, index: number) => void
}

function optionState(selected: number | undefined, oi: number, item: SubmitResult["items"][0] | undefined) {
	if (item) {
		if (oi === item.correct_index) return { badge: "bg-primary text-primary-foreground", option: "border-primary bg-primary-tint" }
		if (oi === selected && !item.is_correct) return { badge: "bg-destructive text-primary-foreground", option: "border-destructive bg-destructive-tint" }
		return { badge: "bg-background text-muted", option: "" }
	}
	if (oi === selected) return { badge: "bg-primary text-primary-foreground", option: "border-primary bg-primary-tint" }
	return { badge: "bg-background text-muted", option: "border-border-light hover:border-border" }
}

export function QuestionList({ questions, answers, result, onSelect }: Props) {
	const resultMap = result ? new Map(result.items.map((i) => [i.question_id, i])) : null

	return (
		<div className="space-y-6">
			{questions.map((q, qi) => {
				const selected = answers[q.id]
				const item = resultMap?.get(q.id)

				return (
					<div key={q.id} id={`q-${qi}`} className="space-y-3">
						<p className="text-sm font-bold text-foreground">
							<span className="text-primary mr-1.5">{qi + 1}.</span>
							{q.question}
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
							{q.options.map((opt, oi) => {
								const s = optionState(selected, oi, item)
								return (
									<button
										key={opt}
										type="button"
										disabled={!!result}
										onClick={() => onSelect(q.id, oi)}
										className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left text-sm transition", s.option)}
									>
										<span className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0", s.badge)}>
											{LETTERS[oi]}
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
