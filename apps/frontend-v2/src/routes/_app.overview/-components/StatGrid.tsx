// StatGrid — 4 stat cards hàng ngang. Icon render trần theo rule 0.1 skill-design.md.

import { Clock, Flame, type LucideIcon, PencilLine, Target } from "lucide-react"
import type { ActivityData } from "#/lib/mock/overview"
import { cn } from "#/lib/utils"

interface Props {
	activity: ActivityData
	totalTests: number
}

interface StatItem {
	label: string
	value: string
	icon: LucideIcon
	color: string
}

export function StatGrid({ activity, totalTests }: Props) {
	const studyMinutes = Math.max(0, Math.round(activity.totalStudyTimeMinutes))
	const studyLabel =
		studyMinutes >= 60
			? `${Math.floor(studyMinutes / 60)} giờ${studyMinutes % 60 > 0 ? ` ${studyMinutes % 60} phút` : ""}`
			: `${studyMinutes} phút`

	const stats: StatItem[] = [
		{
			label: "Tổng thời lượng",
			value: studyLabel,
			icon: Clock,
			color: "text-primary",
		},
		{
			label: "Tổng bài tập",
			value: String(activity.totalExercises),
			icon: Target,
			color: "text-warning",
		},
		{
			label: "Tổng số bài test",
			value: String(totalTests),
			icon: PencilLine,
			color: "text-destructive",
		},
		{
			label: "Streak",
			value: `${activity.streak} ngày`,
			icon: Flame,
			color: "text-success",
		},
	]

	return (
		<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			{stats.map((s) => {
				const Icon = s.icon
				return (
					<div key={s.label} className="rounded-2xl bg-muted/50 p-4">
						<div className="flex items-center gap-3">
							<Icon className={cn("size-6 shrink-0", s.color)} />
							<div className="min-w-0">
								<p className="truncate text-sm text-muted-foreground">{s.label}</p>
								<p className={cn("truncate text-lg font-bold", s.color)}>{s.value}</p>
							</div>
						</div>
					</div>
				)
			})}
		</div>
	)
}
