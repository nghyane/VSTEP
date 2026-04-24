import type { GrammarExercise } from "#/features/grammar/types"
import type { GrammarResult } from "#/features/grammar/use-grammar-exercise"
import { cn } from "#/lib/utils"

export function GrammarQuestion({ exercise }: { exercise: GrammarExercise }) {
	switch (exercise.kind) {
		case "mcq":
			return <p className="font-bold text-lg text-foreground">{exercise.payload.prompt}</p>
		case "error_correction":
			return (
				<div>
					<p className="text-sm text-muted mb-2">Tìm và sửa lỗi sai trong câu:</p>
					<p className="font-bold text-lg text-foreground">{exercise.payload.sentence}</p>
				</div>
			)
		case "fill_blank":
			return (
				<div>
					<p className="text-sm text-muted mb-2">Điền từ vào chỗ trống:</p>
					<p className="font-bold text-lg text-foreground">{exercise.payload.template}</p>
				</div>
			)
		case "rewrite":
			return (
				<div>
					<p className="text-sm text-muted mb-2">{exercise.payload.instruction}</p>
					<p className="font-bold text-lg text-foreground">{exercise.payload.original}</p>
				</div>
			)
	}
}

export function GrammarInput({
	exercise,
	selected,
	textAnswer,
	result,
	onSelect,
	onText,
}: {
	exercise: GrammarExercise
	selected: number | null
	textAnswer: string
	result: GrammarResult | null
	onSelect: (i: number) => void
	onText: (v: string) => void
}) {
	if (exercise.kind === "mcq") {
		return (
			<div className="space-y-2">
				{exercise.payload.options.map((opt, i) => (
					<button
						key={opt}
						type="button"
						disabled={!!result}
						onClick={() => onSelect(i)}
						className={cn(
							"card w-full p-4 text-left text-sm font-bold transition",
							result
								? result.correct && selected === i
									? "border-primary bg-primary-tint text-primary"
									: !result.correct && selected === i
										? "border-destructive bg-destructive-tint text-destructive"
										: ""
								: selected === i
									? "border-primary bg-primary-tint text-primary"
									: "hover:bg-background",
						)}
					>
						{opt}
					</button>
				))}
			</div>
		)
	}

	const placeholder =
		exercise.kind === "error_correction"
			? "Nhập câu đã sửa..."
			: exercise.kind === "rewrite"
				? "Viết lại câu..."
				: "Điền từ..."

	return (
		<input
			type="text"
			value={textAnswer}
			onChange={(e) => onText(e.target.value)}
			disabled={!!result}
			placeholder={placeholder}
			className="w-full h-12 px-4 rounded-(--radius-button) border-2 border-border-light bg-surface text-foreground text-base hover:border-border focus:border-border-focus focus:outline-none transition"
		/>
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
