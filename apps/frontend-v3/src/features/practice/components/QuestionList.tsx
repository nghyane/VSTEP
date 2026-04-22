import { Icon } from "#/components/Icon"
import type { McqQuestion, SubmitResult } from "#/features/practice/types"
import { cn } from "#/lib/utils"

const LETTERS = ["A", "B", "C", "D"]

interface Props {
	questions: McqQuestion[]
	answers: Record<string, number>
	result: SubmitResult | null
	onSelect: (questionId: string, index: number) => void
}

function optionStyles(selected: number | undefined, oi: number, item: SubmitResult["items"][0] | undefined) {
	if (item) {
		if (oi === item.correct_index)
			return {
				badge: "bg-primary text-primary-foreground",
				option: "border-primary border-b-primary bg-primary-tint",
			}
		if (oi === selected && !item.is_correct)
			return {
				badge: "bg-destructive text-primary-foreground",
				option: "border-destructive border-b-destructive bg-destructive-tint",
			}
		return { badge: "bg-background text-subtle", option: "border-border" }
	}
	if (oi === selected)
		return {
			badge: "bg-primary text-primary-foreground",
			option: "border-primary border-b-primary bg-primary-tint",
		}
	return { badge: "bg-background text-muted", option: "border-border hover:border-primary" }
}

export function QuestionList({ questions, answers, result, onSelect }: Props) {
	const resultMap = result ? new Map(result.items.map((i) => [i.question_id, i])) : null

	return (
		<div className="space-y-8">
			{questions.map((q, qi) => {
				const selected = answers[q.id]
				const item = resultMap?.get(q.id)

				return (
					<div key={q.id} id={`q-${qi}`}>
						<p className="font-bold text-base text-foreground mb-3">
							<span className="text-primary mr-2">{qi + 1}.</span>
							{q.question}
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{q.options.map((opt, oi) => {
								const s = optionStyles(selected, oi, item)
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
									>
										<span
											className={cn(
												"w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
												s.badge,
											)}
										>
											{LETTERS[oi]}
										</span>
										<span className="text-sm font-bold text-foreground">{opt}</span>
									</button>
								)
							})}
						</div>
						{item && <ExplanationBlock item={item} question={q} />}
					</div>
				)
			})}
		</div>
	)
}

function ExplanationBlock({ item, question }: { item: SubmitResult["items"][0]; question: McqQuestion }) {
	const correct = item.is_correct

	return (
		<div
			className={cn(
				"mt-3 rounded-xl border-2 p-4",
				correct ? "border-primary/30 bg-primary-tint/50" : "border-destructive/30 bg-destructive-tint/50",
			)}
		>
			<div className="flex items-center gap-2 mb-2">
				<Icon
					name={correct ? "check" : "close"}
					size="xs"
					className={correct ? "text-primary" : "text-destructive"}
				/>
				<span className={cn("text-sm font-bold", correct ? "text-primary" : "text-destructive")}>
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
