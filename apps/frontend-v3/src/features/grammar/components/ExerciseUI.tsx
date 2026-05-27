import type { GrammarExercise } from "#/features/grammar/types"
import type { GrammarResult } from "#/features/grammar/use-grammar-exercise"
import { cn } from "#/lib/utils"

export function GrammarQuestion({ exercise }: { exercise: GrammarExercise }) {
	return <p className="font-bold text-lg text-foreground">{exercise.payload.prompt}</p>
}

export function GrammarInput({
	exercise,
	selected,
	result,
	onSelect,
}: {
	exercise: GrammarExercise
	selected: number | null
	result: GrammarResult | null
	onSelect: (i: number) => void
}) {
	return (
		<div className="space-y-2">
			{exercise.payload.options.map((option, index) => (
				<button
					key={option}
					type="button"
					disabled={!!result}
					onClick={() => onSelect(index)}
					className={cn(
						"card w-full p-4 text-left text-sm font-bold transition",
						result
							? result.correct && selected === index
								? "border-primary bg-primary-tint text-primary"
								: !result.correct && selected === index
									? "border-destructive bg-destructive-tint text-destructive"
									: ""
							: selected === index
								? "border-primary bg-primary-tint text-primary"
								: "hover:bg-background",
					)}
				>
					{option}
				</button>
			))}
		</div>
	)
}

export function GrammarFeedback({ result }: { result: GrammarResult | null }) {
	if (!result) return null
	return (
		<div
			className={cn(
				"card p-4",
				result.correct ? "border-primary bg-primary-tint" : "border-destructive bg-destructive-tint",
			)}
		>
			<p className={cn("font-bold text-sm", result.correct ? "text-primary" : "text-destructive")}>
				{result.correct ? "Chính xác!" : "Chưa đúng"}
			</p>
			<p className="text-sm text-muted mt-1">{result.explanation}</p>
			<p className="text-xs text-subtle mt-2">
				Mastery: {result.mastery.computed_level} · {result.mastery.accuracy_percent}%
			</p>
		</div>
	)
}
