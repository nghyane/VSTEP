// StatGrid — 4 stat cards VSTEP-phù hợp trên tab Tổng quan.

import { CalendarDays, type LucideIcon, TrendingDown } from "lucide-react"
import type { OverviewStats } from "#/lib/mock/overview"
import { cn } from "#/lib/utils"

const WEAK_SKILL_LABEL: Record<string, string> = {
	listening: "Listening",
	reading: "Reading",
	writing: "Writing",
	speaking: "Speaking",
}

const WEAK_SKILL_COLOR: Record<string, string> = {
	listening: "text-skill-listening",
	reading: "text-skill-reading",
	writing: "text-skill-writing",
	speaking: "text-skill-speaking",
}

interface Props {
	stats: OverviewStats
}

interface StatItem {
	label: string
	value: string
	icon: LucideIcon
	color: string
	subColor?: string
}

export function StatGrid({ stats }: Props) {
	const items: StatItem[] = [
		{
			label: "Ngày còn lại",
			value: `${stats.daysLeft} ngày`,
			icon: CalendarDays,
			color: "text-primary",
		},
		{
			label: "Tổng bài test",
			value: String(stats.totalTests),
			icon: TrendingDown,
			color: "text-warning",
		},
		{
			label: "Điểm trung bình",
			value: stats.avgScore > 0 ? stats.avgScore.toFixed(1) : "—",
			icon: TrendingDown,
			color: "text-destructive",
		},
		{
			label: "Kỹ năng yếu",
			value: stats.weakestSkill ? (WEAK_SKILL_LABEL[stats.weakestSkill] ?? "—") : "—",
			icon: TrendingDown,
			color: "text-foreground",
			subColor: stats.weakestSkill ? WEAK_SKILL_COLOR[stats.weakestSkill] : "text-muted-foreground",
		},
	]

	return (
		<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			{items.map((s) => {
				const Icon = s.icon
				return (
					<div key={s.label} className="rounded-2xl bg-muted/50 p-4">
						<div className="flex items-center gap-3">
							<Icon className={cn("size-6 shrink-0", s.color)} />
							<div className="min-w-0">
								<p className="truncate text-sm text-muted-foreground">{s.label}</p>
								<p className={cn("truncate text-lg font-bold", s.subColor ?? s.color)}>{s.value}</p>
							</div>
						</div>
					</div>
				)
			})}
		</div>
	)
}
