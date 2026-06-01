// WordCountMilestones — writing-specific progress bar với min/max markers.

import { cn } from "#/shared/lib/utils"

interface Props {
	wordCount: number
	minWords: number
	maxWords: number
}

export function WordCountMilestones({ wordCount, minWords, maxWords }: Props) {
	const pct = Math.min(100, Math.round((wordCount / maxWords) * 100))
	const minPct = Math.round((minWords / maxWords) * 100)
	const inRange = wordCount >= minWords && wordCount <= maxWords
	const over = wordCount > maxWords

	const fillColor = over ? "bg-destructive" : inRange ? "bg-success" : "bg-warning"

	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between text-xs">
				<span
					className={cn(
						"font-semibold tabular-nums",
						over ? "text-destructive" : inRange ? "text-success" : "text-warning",
					)}
				>
					{wordCount} từ
				</span>
				<span className="text-muted-foreground">
					{minWords}–{maxWords} từ
				</span>
			</div>
			<div className="relative h-3 w-full overflow-hidden rounded-full bg-muted shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-border/30">
				<div
					className={cn(
						"h-full rounded-full transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)]",
						fillColor,
					)}
					style={{ width: `${pct}%` }}
				/>
				{/* Min marker */}
				<div
					className="absolute top-0 bottom-0 w-0.5 bg-foreground/30"
					style={{ left: `${minPct}%` }}
				/>
			</div>
			<div className="flex justify-between text-xs text-muted-foreground">
				<span>0</span>
				<span style={{ marginLeft: `${minPct - 5}%` }}>min {minWords}</span>
				<span>max {maxWords}</span>
			</div>
		</div>
	)
}
