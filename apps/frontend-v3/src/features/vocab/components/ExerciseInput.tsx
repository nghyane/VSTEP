import type { ExerciseKind, ExerciseResult } from "#/features/vocab/use-exercise-session"
import { cn } from "#/lib/utils"

interface McqProps {
	options: string[]
	selected: number | null
	result: ExerciseResult | null
	onSelect: (i: number) => void
}

export function McqOptions({ options, selected, result, onSelect }: McqProps) {
	return (
		<div className="space-y-2">
			{options.map((opt, i) => (
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

interface TextProps {
	kind: ExerciseKind
	value: string
	disabled: boolean
	onChange: (v: string) => void
}

export function TextInput({ kind, value, disabled, onChange }: TextProps) {
	return (
		<input
			type="text"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			disabled={disabled}
			placeholder={kind === "fill_blank" ? "Điền từ..." : "Nhập dạng từ đúng..."}
			className="w-full h-12 px-4 rounded-(--radius-button) border-2 border-border-light bg-surface text-foreground text-base hover:border-border focus:border-border-focus focus:outline-none transition"
		/>
	)
}
