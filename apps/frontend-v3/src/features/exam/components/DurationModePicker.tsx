import {
	computeModeDuration,
	DURATION_MODE_OPTIONS,
	type DurationMode,
} from "#/features/exam/exam-start-plan"
import { cn } from "#/lib/utils"

interface Props {
	baseMinutes: number
	value: DurationMode
	onChange: (mode: DurationMode) => void
}

export function DurationModePicker({ baseMinutes, value, onChange }: Props) {
	return (
		<div className="space-y-2">
			{DURATION_MODE_OPTIONS.map(({ key, label, description }) => (
				<DurationModeOption
					key={key}
					mode={key}
					label={label}
					description={description}
					minutes={computeModeDuration(baseMinutes, key)}
					active={value === key}
					onChange={onChange}
				/>
			))}
		</div>
	)
}

interface DurationModeOptionProps {
	mode: DurationMode
	label: string
	description: string
	minutes: number
	active: boolean
	onChange: (mode: DurationMode) => void
}

function DurationModeOption({
	mode,
	label,
	description,
	minutes,
	active,
	onChange,
}: DurationModeOptionProps) {
	return (
		<label
			className={cn(
				"flex cursor-pointer items-center justify-between rounded-(--radius-button) border-2 px-3 py-2.5 transition-colors",
				active ? "border-primary/30 bg-primary-tint" : "border-transparent hover:bg-background",
			)}
		>
			<input
				type="radio"
				name="exam-duration-mode"
				value={mode}
				checked={active}
				onChange={() => onChange(mode)}
				className="sr-only"
			/>
			<div className="flex items-center gap-3">
				<div
					className={cn(
						"flex size-4 shrink-0 items-center justify-center rounded-full border-2",
						active ? "border-primary" : "border-border",
					)}
				>
					{active && <div className="size-2 rounded-full bg-primary" />}
				</div>
				<span className={cn("text-sm font-bold", active ? "text-primary-dark" : "text-foreground")}>
					{label}
				</span>
			</div>
			<div className="flex items-center gap-2">
				<span className="text-xs text-subtle">{description}</span>
				<span className="text-sm font-extrabold tabular-nums text-foreground">{minutes} phút</span>
			</div>
		</label>
	)
}
