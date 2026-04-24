import type { ReactNode } from "react"
import { cn } from "#/lib/utils"

interface Props {
	title: string
	description?: string
	value: string | number
	trend?: { value: number; label: string }
	icon: ReactNode
	className?: string
}

export function StatCard({ title, description, value, trend, icon, className }: Props) {
	return (
		<div className={cn("rounded-(--radius-card) border border-border bg-surface p-5", className)}>
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<div className="text-xs font-medium text-muted">{title}</div>
					<div className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{value}</div>
					{description && <div className="mt-1 text-xs text-subtle">{description}</div>}
					{trend && (
						<div
							className={cn(
								"mt-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
								trend.value > 0 ? "bg-success-tint text-success" : "bg-danger-tint text-danger",
							)}
						>
							{trend.value > 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
						</div>
					)}
				</div>
				<div className="flex size-10 items-center justify-center rounded-md bg-surface-muted text-muted">
					{icon}
				</div>
			</div>
		</div>
	)
}
