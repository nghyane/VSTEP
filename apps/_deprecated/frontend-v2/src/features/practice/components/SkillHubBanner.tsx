// SkillHubBanner — banner skill-coded hiển thị overall progress cho mỗi tab.

import { cn } from "#/shared/lib/utils"

interface Props {
	skillLabel: string
	icon: React.ReactNode
	completed: number
	total: number
	accentClass: string
	bgClass: string
}

export function SkillHubBanner({
	skillLabel,
	icon,
	completed,
	total,
	accentClass,
	bgClass,
}: Props) {
	const pct = total > 0 ? Math.round((completed / total) * 100) : 0
	return (
		<div className={cn("rounded-2xl border-2 border-b-4 p-5", accentClass)}>
			<div className="flex items-center gap-3">
				<div
					className={cn("flex size-10 items-center justify-center rounded-xl text-white", bgClass)}
				>
					{icon}
				</div>
				<div className="min-w-0 flex-1">
					<h2 className="text-lg font-bold">{skillLabel}</h2>
					<p className="text-sm text-muted-foreground">
						{completed}/{total} bài hoàn thành
					</p>
				</div>
				<span className="text-2xl font-bold tabular-nums text-foreground">{pct}%</span>
			</div>
			<div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-border/30">
				<div
					className={cn(
						"h-full rounded-full transition-all shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)]",
						bgClass,
					)}
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	)
}
