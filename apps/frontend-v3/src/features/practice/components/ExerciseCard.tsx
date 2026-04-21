import { cn } from "#/lib/utils"

interface Props {
	title: string
	description: string | null
	meta: string
	href: React.ReactNode
	status?: "not_started" | "in_progress" | "completed"
	score?: number
	total?: number
}

export function ExerciseCard({ title, description, meta, href, status = "not_started", score, total }: Props) {
	const pct = total && score !== undefined ? Math.round((score / total) * 100) : 0
	const hasProgress = status !== "not_started" && total && total > 0

	return (
		<div className="group relative card-interactive p-4 flex flex-col">
			<div className="flex items-start gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-sm font-bold text-foreground">{title}</p>
					<p className="mt-0.5 text-xs text-muted">{meta}</p>
				</div>
				{status === "completed" && <span className="text-xs font-bold text-primary bg-primary-tint px-2 py-0.5 rounded-full">Hoàn thành</span>}
				{status === "in_progress" && <span className="text-xs font-bold text-warning bg-warning-tint px-2 py-0.5 rounded-full">Đang làm</span>}
			</div>

			{description && <p className="mt-2 text-xs text-subtle line-clamp-2 flex-1">{description}</p>}

			{hasProgress && (
				<div className="mt-3">
					<div className="flex items-center justify-between text-xs text-muted tabular-nums">
						<span>{score}/{total} đúng</span>
						<span className="font-bold">{pct}%</span>
					</div>
					<div className="mt-1 h-2 bg-background rounded-full overflow-hidden">
						<div
							className={cn("h-full rounded-full transition-all", pct >= 80 ? "bg-primary" : pct >= 50 ? "bg-warning" : "bg-destructive")}
							style={{ width: `${pct}%` }}
						/>
					</div>
				</div>
			)}

			<div className="mt-3">
				<span className={cn("btn text-xs py-1.5 px-4", status === "not_started" ? "btn-primary" : "btn-secondary text-primary")}>
					{status === "completed" ? "Làm lại" : status === "in_progress" ? "Tiếp tục" : "Bắt đầu"}
				</span>
			</div>

			{href}
		</div>
	)
}
