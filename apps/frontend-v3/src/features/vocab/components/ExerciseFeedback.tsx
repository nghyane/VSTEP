import type { ExerciseResult } from "#/features/vocab/use-exercise-session"
import { cn } from "#/lib/utils"

interface Props {
	result: ExerciseResult | null
}

export function ExerciseFeedback({ result }: Props) {
	if (!result) return null
	return (
		<div className={cn("card p-4", result.correct ? "border-primary bg-primary-tint" : "border-destructive bg-destructive-tint")}>
			<p className={cn("font-bold text-sm", result.correct ? "text-primary" : "text-destructive")}>
				{result.correct ? "Chính xác!" : "Chưa đúng"}
			</p>
			{result.explanation && <p className="text-sm text-muted mt-1">{result.explanation}</p>}
		</div>
	)
}
