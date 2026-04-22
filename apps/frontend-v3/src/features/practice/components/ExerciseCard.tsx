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
}

export function ExerciseCard({ title, description, meta, overlay, progress }: Props) {
	const pct = progress ? Math.round((progress.score / progress.total) * 100) : 0
	const hasBar = progress && progress.status !== "not_started" && progress.total > 0
	const status = progress?.status ?? "not_started"

	return (
		<div className="group relative card-interactive p-5 flex flex-col">
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

			{hasBar && (
				<div className="mt-3">
					<div className="flex items-center justify-between text-xs text-muted tabular-nums">
						<span>
							{progress.score}/{progress.total} đúng
						</span>
						<span className="font-bold">{pct}%</span>
					</div>
					<div className="mt-1 h-2 bg-background rounded-full overflow-hidden">
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
