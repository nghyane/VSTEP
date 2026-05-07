import { cn } from "#/lib/utils"

interface Props {
	count: number
	min: number
	max: number
}

export function WritingWordProgress({ count, min, max }: Props) {
	const pct = Math.min(100, (count / max) * 100)
	const inRange = count >= min && count <= max
	const over = count > max

	return (
		<div className="flex items-center gap-3">
			<div className="flex-1 h-2 bg-background rounded-full overflow-hidden relative">
				{/* Min marker */}
				<div
					className="absolute top-0 bottom-0 w-px bg-border z-10"
					style={{ left: `${(min / max) * 100}%` }}
				/>
				<div
					className={cn(
						"h-full rounded-full transition-all duration-300",
						over ? "bg-destructive" : inRange ? "bg-success" : "bg-skill-writing/50",
					)}
					style={{ width: `${pct}%` }}
				/>
			</div>
			<span
				className={cn(
					"text-xs font-bold tabular-nums shrink-0",
					inRange ? "text-success" : over ? "text-destructive" : "text-muted",
				)}
			>
				{count} / {min}–{max}
			</span>
		</div>
	)
}
