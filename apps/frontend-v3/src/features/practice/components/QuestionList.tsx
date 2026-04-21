import type { McqQuestion, SubmitResult } from "#/features/practice/types"
import { cn } from "#/lib/utils"

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
					<div key={q.id} className="card p-5">
						<p className="font-bold text-sm text-foreground mb-3">
							<span className="text-subtle mr-2">Câu {qi + 1}.</span>
							{q.question}
						</p>
						<div className="space-y-2">
							{q.options.map((opt, oi) => {
								let style = ""
								if (item) {
									if (oi === item.correct_index) style = "border-primary bg-primary-tint text-primary"
									else if (oi === selected && !item.is_correct) style = "border-destructive bg-destructive-tint text-destructive"
								} else if (oi === selected) {
									style = "border-primary bg-primary-tint text-primary"
								}

								return (
									<button
										key={opt}
										type="button"
										disabled={!!result}
										onClick={() => onSelect(q.id, oi)}
										className={cn("w-full p-3 text-left text-sm font-bold rounded-(--radius-button) border-2 border-border-light transition", style || "hover:border-border")}
									>
										{opt}
									</button>
								)
							})}
						</div>
						{item?.explanation && (
							<p className="text-sm text-muted mt-3">{item.explanation}</p>
						)}
					</div>
				)
			})}
		</div>
	)
}
