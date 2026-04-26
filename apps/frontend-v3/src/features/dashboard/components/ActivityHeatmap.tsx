import { useQuery } from "@tanstack/react-query"
import { activityHeatmapQuery } from "#/features/dashboard/queries"
import type { ActivityDay } from "#/features/dashboard/types"
import { cn } from "#/lib/utils"
import { heatmapLevels } from "#/lib/vstep"

const WEEKS = 12
const DAYS = 7
const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

function toLevel(count: number): number {
	if (count <= 0) return 0
	for (let i = heatmapLevels.length - 1; i >= 0; i--) {
		if (count >= heatmapLevels[i]) return i + 1
	}
	return 1
}

const LEVEL_CLASSES = ["bg-border", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"]
const LEVEL_LABELS = ["0", "1", "2", "3", "4+"]

type Cell = { level: number; count: number; date: string; future: boolean }

function isoDate(d: Date): string {
	const y = d.getFullYear()
	const m = String(d.getMonth() + 1).padStart(2, "0")
	const day = String(d.getDate()).padStart(2, "0")
	return `${y}-${m}-${day}`
}

function formatDate(iso: string): string {
	const [, m, d] = iso.split("-")
	return `${d}/${m}`
}

function buildGrid(data: ActivityDay[]): Cell[][] {
	const map = new Map(data.map((d) => [d.date.slice(0, 10), d.count]))
	const today = new Date()
	const todayKey = isoDate(today)
	// Align end to the Sunday of this week so today is included
	const end = new Date(today)
	const endDow = (end.getDay() + 6) % 7 // 0=Mon..6=Sun
	end.setDate(end.getDate() + (6 - endDow))
	const start = new Date(end)
	start.setDate(start.getDate() - (WEEKS * DAYS - 1))

	const weeks: Cell[][] = []
	const cursor = new Date(start)
	for (let w = 0; w < WEEKS; w++) {
		const week: Cell[] = []
		for (let d = 0; d < DAYS; d++) {
			const key = isoDate(cursor)
			const count = map.get(key) ?? 0
			week.push({ level: toLevel(count), count, date: key, future: key > todayKey })
			cursor.setDate(cursor.getDate() + 1)
		}
		weeks.push(week)
	}
	return weeks
}

export function ActivityHeatmap() {
	const { data, isLoading } = useQuery(activityHeatmapQuery)

	if (isLoading || !data) return null

	const activityData = data.data
	const weeks = buildGrid(activityData)
	const totalDays = activityData.filter((d) => d.count > 0).length

	return (
		<section className="card p-6">
			<div className="flex items-start justify-between mb-5">
				<div>
					<h3 className="font-extrabold text-lg text-foreground">
						{isLoading ? "Đang tải..." : "Hoạt động làm bài thi"}
					</h3>
					<p className="text-sm text-subtle mt-1">{totalDays} ngày có làm bài trong 12 tuần qua</p>
				</div>
				<div className="flex items-center gap-1.5 text-xs text-subtle">
					<span>Ít</span>
					{LEVEL_CLASSES.map((cls, i) => (
						<div key={cls} className="relative group">
							<span className={cn("block w-4 h-4 rounded", cls)} />
							<span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background opacity-0 group-hover:opacity-100 transition">
								{LEVEL_LABELS[i]} bài
								<span className="absolute left-1/2 top-full -translate-x-1/2 -mt-px w-0 h-0 border-l-[3px] border-r-[3px] border-t-[3px] border-l-transparent border-r-transparent border-t-foreground" />
							</span>
						</div>
					))}
					<span>Nhiều</span>
				</div>
			</div>

			<div className="flex gap-2">
				<div className="grid grid-rows-7 gap-1 shrink-0">
					{DAY_LABELS.map((d) => (
						<div key={d} className="h-4 text-xs text-subtle leading-4 pr-1">
							{d}
						</div>
					))}
				</div>
				<div
					className="grid grid-rows-7 grid-flow-col gap-1 flex-1 min-w-0"
					style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
				>
					{weeks.flat().map((cell, i) =>
						cell.future ? (
							<div key={i} className="h-4" />
						) : (
							<div key={i} className="relative group h-4">
								<div
									className={cn(
										"h-4 rounded hover:ring-1 hover:ring-border transition",
										LEVEL_CLASSES[cell.level],
									)}
								/>
								<span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background opacity-0 group-hover:opacity-100 transition z-10">
									{formatDate(cell.date)} · {cell.count} bài
									<span className="absolute left-1/2 top-full -translate-x-1/2 -mt-px w-0 h-0 border-l-[3px] border-r-[3px] border-t-[3px] border-l-transparent border-r-transparent border-t-foreground" />
								</span>
							</div>
						),
					)}
				</div>
			</div>
		</section>
	)
}
