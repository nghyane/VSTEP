import type { ReactNode } from "react"
import { Icon } from "#/components/Icon"
import { cn } from "#/lib/utils"

export interface ExerciseCardProgress {
	status: "not_started" | "in_progress" | "completed"
	score: number
	total: number
}

interface Props {
	title: string
	description: string | null
	meta: string
	overlay: ReactNode
	progress?: ExerciseCardProgress
	progressLabel?: string
	level?: string
	tag?: string
}

const LEVEL_COLORS: Record<string, string> = {
	A1: "bg-success/15 text-success border-success/30",
	A2: "bg-info/15 text-info border-info/30",
	B1: "bg-warning/15 text-warning border-warning/30",
	B2: "bg-skill-speaking/15 text-skill-speaking border-skill-speaking/30",
	C1: "bg-destructive/15 text-destructive border-destructive/30",
	C2: "bg-skill-reading/15 text-skill-reading border-skill-reading/30",
}

function levelColor(level: string): string {
	const primaryLevel =
		level
			.split(/[/·,\s]+/)
			.find((part) => part.length > 0)
			?.toUpperCase() ?? level.toUpperCase()
	return LEVEL_COLORS[primaryLevel] ?? "bg-muted/15 text-muted border-border"
}

export function ExerciseCard({
	title,
	description,
	meta,
	overlay,
	progress,
	progressLabel,
	level,
	tag,
}: Props) {
	const pct = progress && progress.total > 0 ? Math.round((progress.score / progress.total) * 100) : 0
	const hasBar = progress && progress.status !== "not_started" && progress.total > 0
	const hasProgressBlock = progress && progress.total > 0
	const levelStyle = level ? levelColor(level) : null

	return (
		<div className="group relative card-interactive flex min-h-44 flex-col overflow-hidden">
			{level && levelStyle && (
				<span
					className={cn(
						"absolute top-3 right-3 px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider",
						levelStyle,
					)}
				>
					{level}
				</span>
			)}

			<div className="p-5 flex min-h-0 flex-1 flex-col">
				<div className={cn("min-w-0", level && "pr-12")}>
					<p className="line-clamp-2 text-base font-bold text-foreground">{title}</p>
					<p className="mt-1 text-xs text-muted">{meta}</p>
				</div>

				{description && (
					<p className="mt-2 line-clamp-3 text-sm leading-relaxed text-subtle">{description}</p>
				)}

				{tag && (
					<div className="mt-auto flex shrink-0 items-center gap-1.5 pt-3">
						<Icon name="check" size="xs" className="text-success" />
						<span className="text-xs font-bold text-success">{tag}</span>
					</div>
				)}
			</div>

			{hasProgressBlock && (
				<div className="mt-auto px-5 pb-4">
					<div className="flex items-center justify-between mb-1">
						<span className="text-xs font-bold text-muted tabular-nums">{progressLabel ?? `${pct}%`}</span>
					</div>
					{hasBar && (
						<div className="h-1.5 bg-background rounded-full overflow-hidden">
							<div
								className={cn(
									"h-full rounded-full transition-all",
									pct >= 80 ? "bg-primary" : pct >= 50 ? "bg-warning" : "bg-destructive",
								)}
								style={{ width: `${pct}%` }}
							/>
						</div>
					)}
				</div>
			)}

			{overlay}
		</div>
	)
}
