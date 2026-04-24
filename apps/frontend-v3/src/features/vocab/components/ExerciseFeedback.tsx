import { Icon } from "#/components/Icon"
import type { ExerciseResult } from "#/features/vocab/use-exercise-session"
import { cn } from "#/lib/utils"

interface Props {
	result: ExerciseResult | null
	correctAnswer?: string
}

export function ExerciseFeedback({ result, correctAnswer }: Props) {
	if (!result) return null
	return (
		<div
			className={cn(
				"card p-4",
				result.correct ? "border-primary bg-primary-tint" : "border-destructive bg-destructive-tint",
			)}
		>
			<div className="flex items-center gap-2">
				<Icon
					name={result.correct ? "check" : "close"}
					size="xs"
					className={result.correct ? "text-primary" : "text-destructive"}
				/>
				<p className={cn("font-bold text-sm", result.correct ? "text-primary" : "text-destructive")}>
					{result.correct ? "Chính xác!" : "Chưa đúng"}
				</p>
			</div>
			{!result.correct && correctAnswer && (
				<p className="text-sm text-foreground mt-2">
					Đáp án: <strong className="text-primary">{correctAnswer}</strong>
				</p>
			)}
			{result.explanation && <p className="text-sm text-muted mt-1">{result.explanation}</p>}
		</div>
	)
}
