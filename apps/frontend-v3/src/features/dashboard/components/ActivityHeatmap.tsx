import { useQuery } from "@tanstack/react-query"
import { activityHeatmapQuery } from "#/features/dashboard/queries"
import type { SkillActivityDay } from "#/features/dashboard/types"
import { cn } from "#/lib/utils"

const WEEKS = 12
const DAYS = 7
const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

function totalActivity(day: SkillActivityDay): number {
	return day.listening + day.reading + day.writing + day.speaking + day.vocab + day.exam
}

function toLevel(total: number): number {
	if (total <= 0) return 0
	if (total >= 10) return 4
	if (total >= 6) return 3
	if (total >= 3) return 2
	return 1
}

const LEVEL_CLASSES = ["bg-border", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"]

type Cell = { level: number; total: number; date: string; future: boolean; day?: SkillActivityDay }

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

function tooltipText(day?: SkillActivityDay): string {
	if (!day) return "0 hoạt động"
	const parts: string[] = []
	if (day.listening > 0) parts.push(`Nghe ${day.listening}`)
	if (day.reading > 0) parts.push(`Đọc ${day.reading}`)
	if (day.writing > 0) parts.push(`Viết ${day.writing}`)
	if (day.speaking > 0) parts.push(`Nói ${day.speaking}`)
	if (day.vocab > 0) parts.push(`Từ vựng ${day.vocab}`)
	if (day.exam > 0) parts.push(`Thi ${day.exam}`)
	return parts.join(" · ") || "0 hoạt động"
}

function buildGrid(data: SkillActivityDay[]): Cell[][] {
	const map = new Map(data.map((d) => [d.date.slice(0, 10), d]))
	const today = new Date()
	const todayKey = isoDate(today)
	const end = new Date(today)
	const endDow = (end.getDay() + 6) % 7
	end.setDate(end.getDate() + (6 - endDow))
	const start = new Date(end)
	start.setDate(start.getDate() - (WEEKS * DAYS - 1))

	const weeks: Cell[][] = []
	const cursor = new Date(start)
	for (let w = 0; w < WEEKS; w++) {
		const week: Cell[] = []
		for (let d = 0; d < DAYS; d++) {
			const key = isoDate(cursor)
			const day = map.get(key)
			const total = day ? totalActivity(day) : 0
			week.push({ level: toLevel(total), total, date: key, future: key > todayKey, day })
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
	const totalDays = activityData.filter((d) => totalActivity(d) > 0).length

	return (
		<section className="card p-6">
			<div className="flex items-start justify-between mb-5">
				<div>
					<h3 className="font-extrabold text-lg text-foreground">Hoạt động luyện tập</h3>
					<p className="text-sm text-subtle mt-1">{totalDays} ngày có luyện tập trong 12 tuần qua</p>
				</div>
				<div className="flex items-center gap-1.5 text-xs text-subtle">
					<span>Ít</span>
					{LEVEL_CLASSES.map((cls) => (
						<div key={cls} className="relative group">
							<span className={cn("block w-4 h-4 rounded", cls)} />
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
									{formatDate(cell.date)} · {tooltipText(cell.day)}
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
