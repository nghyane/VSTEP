import type { ExerciseKind } from "#/features/vocab/types"
import type { ExerciseResult } from "#/features/vocab/use-exercise-session"
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
	onSubmit: () => void
	submitting: boolean
	onChange: (v: string) => void
}

export function TextInput({ kind, value, disabled, onSubmit, submitting, onChange }: TextProps) {
	return (
		<div className="flex gap-2">
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={(e) => e.key === "Enter" && !disabled && value.trim() && onSubmit()}
				disabled={disabled}
				placeholder={kind === "fill_blank" ? "Điền từ..." : "Nhập dạng từ đúng..."}
				className="flex-1 h-14 px-5 rounded-(--radius-button) border-2 border-border bg-surface text-foreground text-lg focus:border-primary focus:outline-none transition"
			/>
			{!disabled && (
				<button
					type="button"
					onClick={onSubmit}
					disabled={!value.trim() || submitting}
					className="btn btn-primary h-14 px-6 shrink-0 disabled:opacity-50"
				>
					{submitting ? "..." : "Kiểm tra"}
				</button>
			)}
		</div>
	)
}
