// SessionProgressBar — 3D progress bar dùng chung cho 4 skills.
// RFC 0002: h-3 rounded-full bg-muted shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]
// Fill: bg-skill-{X} shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)]

import { cn } from "#/shared/lib/utils"

interface Props {
	current: number
	total: number
	accentClass?: string
	className?: string
}

export function SessionProgressBar({
	current,
	total,
	accentClass = "bg-primary",
	className,
}: Props) {
	const pct = total > 0 ? Math.round((current / total) * 100) : 0
	return (
		<div className={cn("space-y-1.5", className)}>
			<div className="flex items-center justify-between text-xs">
				<span className="font-medium text-muted-foreground">
					{current}/{total} câu
				</span>
				<span className="font-semibold tabular-nums text-foreground">{pct}%</span>
			</div>
			<div className="h-3 w-full overflow-hidden rounded-full bg-muted shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-border/30">
				<div
					className={cn(
						"h-full rounded-full transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)]",
						accentClass,
					)}
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	)
}
