import { useQuery } from "@tanstack/react-query"
import { activityHeatmapQuery } from "#/features/dashboard/queries"
import type { ActivityDay } from "#/features/dashboard/types"
import { cn } from "#/lib/utils"
import { heatmapLevels } from "#/lib/vstep"

const WEEKS = 12
const DAYS = 7
const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

function toLevel(minutes: number): number {
	if (minutes <= 0) return 0
	for (let i = heatmapLevels.length - 1; i >= 0; i--) {
		if (minutes >= heatmapLevels[i]) return i + 1
	}
	return 1
}

const LEVEL_CLASSES = ["bg-border", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"]

function buildGrid(data: ActivityDay[]): number[][] {
	const map = new Map(data.map((d) => [d.date, d.minutes]))
	const today = new Date()
	const start = new Date(today)
	start.setDate(start.getDate() - WEEKS * DAYS)
	// Align to Monday
	const dow = (start.getDay() + 6) % 7
	start.setDate(start.getDate() - dow)

	const weeks: number[][] = []
	const cursor = new Date(start)
	for (let w = 0; w < WEEKS; w++) {
		const week: number[] = []
		for (let d = 0; d < DAYS; d++) {
			const key = cursor.toISOString().slice(0, 10)
			week.push(toLevel(map.get(key) ?? 0))
			cursor.setDate(cursor.getDate() + 1)
		}
		weeks.push(week)
	}
	return weeks
}

export function ActivityHeatmap() {
	const { data, isLoading } = useQuery(activityHeatmapQuery)
	const activityData = data?.data ?? []
	const weeks = buildGrid(activityData)
	const totalDays = activityData.filter((d) => d.minutes > 0).length

	return (
		<section className="card p-6">
			<div className="flex items-start justify-between mb-5">
				<div>
					<h3 className="font-extrabold text-lg text-foreground">
						{isLoading ? "Đang tải..." : "Hoạt động luyện tập"}
					</h3>
					<p className="text-sm text-subtle mt-1">{totalDays} ngày có luyện tập trong 12 tuần qua</p>
				</div>
				<div className="flex items-center gap-1.5 text-xs text-subtle">
					<span>Ít</span>
					{LEVEL_CLASSES.map((cls) => (
						<span key={cls} className={cn("w-3.5 h-3.5 rounded", cls)} />
					))}
					<span>Nhiều</span>
				</div>
			</div>

			<div className="flex gap-1">
				<div className="flex flex-col gap-1 pt-5 pr-2 shrink-0">
					{DAY_LABELS.map((d) => (
						<div key={d} className="h-4 text-xs text-subtle leading-4">
							{d}
						</div>
					))}
				</div>
				<div className="flex-1 min-w-0">
					<div className="grid grid-rows-7 grid-flow-col gap-1">
						{weeks.flat().map((lv, i) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: static grid, stable order
								key={i}
								className={cn(
									"h-4 rounded hover:ring-1 hover:ring-border cursor-pointer transition",
									LEVEL_CLASSES[lv],
								)}
							/>
						))}
					</div>
				</div>
			</div>
		</section>
	)
}
