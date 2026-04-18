// StatGrid — stat cards trên tab Tổng quan
// Band còn thiếu · Xu hướng · Tổng bài test · Kỹ năng yếu

import { Scale, Target, TrendingDown, TrendingUp } from "lucide-react"
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

const TREND_LABEL: Record<string, string> = {
	up: "Cải thiện",
	stable: "Ổn định",
	down: "Cần cải thiện",
}

const TREND_COLOR: Record<string, string> = {
	up: "text-success",
	stable: "text-warning",
	down: "text-destructive",
}

interface Props {
	stats: OverviewStats
}

export function StatGrid({ stats }: Props) {
	const trendIcon = stats.trend === "up" ? TrendingUp : stats.trend === "down" ? TrendingDown : Scale

	const items = [
		{
			label: "Band còn thiếu",
			value: stats.avgScore > 0 ? `+${stats.bandGap.toFixed(1)}` : "—",
			icon: Scale,
			color: "text-primary",
		},
		{
			label: "Xu hướng",
			value: stats.trend ? (TREND_LABEL[stats.trend] ?? "—") : "—",
			icon: trendIcon,
			color: stats.trend ? (TREND_COLOR[stats.trend] ?? "text-muted-foreground") : "text-muted-foreground",
		},
		{
			label: "Tổng bài test",
			value: String(stats.totalTests),
			icon: Target,
			color: "text-skill-reading",
		},
		{
			label: "Kỹ năng yếu",
			value: stats.weakestSkill ? (WEAK_SKILL_LABEL[stats.weakestSkill] ?? "—") : "—",
			icon: TrendingDown,
			color: "text-foreground",
			skillColor: stats.weakestSkill ? WEAK_SKILL_COLOR[stats.weakestSkill] : undefined,
		},
	]

	return (
		<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			{items.map((item) => {
				const Icon = item.icon
				return (
					<div key={item.label} className="rounded-2xl bg-muted/50 p-4">
						<div className="flex items-center gap-3">
							<Icon className={cn("size-6 shrink-0", item.color)} />
							<div className="min-w-0">
								<p className="truncate text-sm text-muted-foreground">{item.label}</p>
								<p
									className={cn(
										"truncate text-lg font-bold",
										"skillColor" in item && item.skillColor ? item.skillColor : item.color,
									)}
								>
									{item.value}
								</p>
							</div>
						</div>
					</div>
				)
			})}
		</div>
	)
}
