import type { McqQuestion, SubmitResult } from "#/features/practice/types"
import { cn } from "#/lib/utils"

interface Props {
	questions: McqQuestion[]
	answers: Record<string, number>
	result: SubmitResult | null
	accentColor?: string
}

export function QuestionNav({ questions, answers, result, accentColor }: Props) {
	const resultMap = result ? new Map(result.items.map((i) => [i.question_id, i])) : null

	return (
		<>
			{questions.map((q, qi) => {
				const isAnswered = answers[q.id] !== undefined
				const item = resultMap?.get(q.id)

				let cls = "border-border bg-surface text-muted"
				let style: React.CSSProperties | undefined

				if (item) {
					if (item.is_correct) {
						if (accentColor) {
							cls = "text-primary-foreground"
							style = {
								borderColor: accentColor,
								backgroundColor: `color-mix(in oklch, ${accentColor} 15%, transparent)`,
								color: accentColor,
							}
						} else {
							cls = "border-primary bg-primary-tint text-primary"
						}
					} else {
						cls = "border-destructive bg-destructive-tint text-destructive"
					}
				} else if (isAnswered) {
					if (accentColor) {
						cls = "text-primary-foreground"
						style = { borderColor: accentColor, backgroundColor: accentColor }
					} else {
						cls = "border-primary bg-primary text-primary-foreground"
					}
				}

				return (
					<a
						key={q.id}
						href={`#q-${qi}`}
						className={cn(
							"w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition shrink-0",
							cls,
						)}
						style={style}
					>
						{qi + 1}
					</a>
				)
			})}
		</>
	)
}
