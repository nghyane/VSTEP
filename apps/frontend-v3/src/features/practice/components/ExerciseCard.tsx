import type { ReactNode } from "react"
import { cn } from "#/lib/utils"

interface Progress {
	status: "not_started" | "in_progress" | "completed"
	score: number
	total: number
}

interface Props {
	title: string
	description: string | null
	meta: string
	overlay: ReactNode
	progress?: Progress
	level?: string
}

const LEVEL_COLORS: Record<string, string> = {
	A1: "bg-success/15 text-success border-success/30",
	A2: "bg-info/15 text-info border-info/30",
	B1: "bg-warning/15 text-warning border-warning/30",
	B2: "bg-skill-speaking/15 text-skill-speaking border-skill-speaking/30",
	C1: "bg-destructive/15 text-destructive border-destructive/30",
	C2: "bg-skill-reading/15 text-skill-reading border-skill-reading/30",
}

export function ExerciseCard({ title, description, meta, overlay, progress, level }: Props) {
	const pct = progress ? Math.round((progress.score / progress.total) * 100) : 0
	const hasBar = progress && progress.status !== "not_started" && progress.total > 0
	const status = progress?.status ?? "not_started"
	const levelStyle = level
		? (LEVEL_COLORS[level.toUpperCase()] ?? "bg-muted/15 text-muted border-border")
		: null

	return (
		<div className="group relative card-interactive flex flex-col overflow-hidden">
			{/* Level tag — top right */}
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

			<div className="p-5 flex flex-col flex-1">
				<div className="flex items-start gap-3">
					<div className="min-w-0 flex-1">
						<p className="text-base font-bold text-foreground">{title}</p>
						<p className="mt-1 text-xs text-muted">{meta}</p>
					</div>
					{status === "completed" && (
						<span className="text-xs font-bold text-primary bg-primary-tint px-2 py-0.5 rounded-full shrink-0">
							Hoàn thành
						</span>
					)}
					{status === "in_progress" && (
						<span className="text-xs font-bold text-warning bg-warning-tint px-2 py-0.5 rounded-full shrink-0">
							Đang làm
						</span>
					)}
				</div>

				{description && <p className="mt-2 text-sm text-subtle line-clamp-2 flex-1">{description}</p>}
			</div>

			{hasBar && (
				<div className="mt-auto px-5 pb-4">
					<div className="flex items-center justify-between text-xs text-muted tabular-nums mb-1">
						<span>
							{progress.score}/{progress.total} đúng
						</span>
						<span className="font-bold">{pct}%</span>
					</div>
					<div className="h-1.5 bg-background rounded-full overflow-hidden">
						<div
							className={cn(
								"h-full rounded-full transition-all",
								pct >= 80 ? "bg-primary" : pct >= 50 ? "bg-warning" : "bg-destructive",
							)}
							style={{ width: `${pct}%` }}
						/>
					</div>
				</div>
			)}

			{overlay}
		</div>
	)
}
