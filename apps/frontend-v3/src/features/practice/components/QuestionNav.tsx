import type { McqQuestion, SubmitResult } from "#/features/practice/types"
import { cn } from "#/lib/utils"

interface Props {
	questions: McqQuestion[]
	answers: Record<string, number>
	result: SubmitResult | null
}

export function QuestionNav({ questions, answers, result }: Props) {
	const resultMap = result ? new Map(result.items.map((i) => [i.question_id, i])) : null

	return (
		<>
			{questions.map((q, qi) => {
				const isAnswered = answers[q.id] !== undefined
				const item = resultMap?.get(q.id)

				let style = "border-border bg-surface text-muted"
				if (item) {
					style = item.is_correct
						? "border-primary bg-primary-tint text-primary"
						: "border-destructive bg-destructive-tint text-destructive"
				} else if (isAnswered) {
					style = "border-skill-listening bg-skill-listening text-primary-foreground"
				}

				return (
					<a key={q.id} href={`#q-${qi}`} className={cn("w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition shrink-0", style)}>
						{qi + 1}
					</a>
				)
			})}
		</>
	)
}
