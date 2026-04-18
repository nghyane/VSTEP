// ActivityHeatmap — GitHub-style contribution graph
// 5 mức đậm nhạt dựa trên số hoạt động/ngày, có tooltip giải thích.

import { Fragment } from "react"
import { cn } from "#/shared/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "#/shared/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "#/shared/ui/tooltip"

interface Props {
	activityByDay: Record<string, number> // "YYYY-MM-DD" → số hoạt động
}

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

// 5 mức màu: 0 = không hoạt động, 1–4 = tăng dần.
// Dùng token primary + opacity để tôn trọng theme và dark mode.
const LEVEL_CLASSES = [
	"bg-muted", // 0
	"bg-primary/20", // 1
	"bg-primary/40", // 2
	"bg-primary/70", // 3
	"bg-primary", // 4
] as const

type Level = 0 | 1 | 2 | 3 | 4

function toLevel(count: number): Level {
	if (count <= 0) return 0
	if (count <= 2) return 1
	if (count <= 5) return 2
	if (count <= 9) return 3
	return 4
}

function formatDateStr(date: Date): string {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, "0")
	const d = String(date.getDate()).padStart(2, "0")
	return `${y}-${m}-${d}`
}

function formatDisplayDate(dateStr: string): string {
	// "2026-04-11" → "Th 7, 11 tháng 4, 2026"
	const [y, m, d] = dateStr.split("-").map(Number)
	if (!y || !m || !d) return dateStr
	const date = new Date(y, m - 1, d)
	return date.toLocaleDateString("vi-VN", {
		weekday: "short",
		day: "numeric",
		month: "long",
		year: "numeric",
	})
}

interface Cell {
	date: string
	count: number
	level: Level
	future: boolean
}

function buildGrid(activityByDay: Record<string, number>) {
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	const start = new Date(today)
	start.setDate(start.getDate() - 12 * 7)
	// Đẩy về thứ 2 đầu tuần (theo lịch VN)
	const dow = (start.getDay() + 6) % 7
	start.setDate(start.getDate() - dow)

	const weeks: Cell[][] = []
	const cursor = new Date(start)

	while (cursor <= today || weeks.length === 0) {
		const week: Cell[] = []
		for (let d = 0; d < 7; d++) {
			const dateStr = formatDateStr(cursor)
			const future = cursor > today
			const count = future ? 0 : (activityByDay[dateStr] ?? 0)
			week.push({ date: dateStr, count, level: toLevel(count), future })
			cursor.setDate(cursor.getDate() + 1)
		}
		weeks.push(week)
	}

	const monthLabels: { label: string; col: number; span: number }[] = []
	let lastMonth = -1
	for (let w = 0; w < weeks.length; w++) {
		const week = weeks[w]
		if (!week) continue
		const firstCell = week[0]
		if (!firstCell) continue
		const mondayDate = new Date(firstCell.date)
		const month = mondayDate.getMonth()
		if (month !== lastMonth) {
			const lastLabel = monthLabels[monthLabels.length - 1]
			if (lastLabel) {
				lastLabel.span = w - lastLabel.col
			}
			monthLabels.push({
				label: mondayDate.toLocaleDateString("vi-VN", { month: "short" }),
				col: w,
				span: 1,
			})
			lastMonth = month
		}
	}
	const lastLabel = monthLabels[monthLabels.length - 1]
	if (lastLabel) {
		lastLabel.span = weeks.length - lastLabel.col
	}

	return { weeks, monthLabels }
}

export function ActivityHeatmap({ activityByDay }: Props) {
	const { weeks, monthLabels } = buildGrid(activityByDay)
	const numWeeks = weeks.length
	const totalActive = weeks.reduce(
		(sum, week) => sum + week.reduce((s, c) => s + (c.future ? 0 : c.count), 0),
		0,
	)

	return (
		<Card className="border-0 bg-muted/30">
			<CardHeader className="flex-row items-center justify-between pb-2">
				<div>
					<CardTitle className="text-base">Tần suất học tập</CardTitle>
					<p className="mt-0.5 text-xs text-muted-foreground">
						{totalActive} hoạt động trong 12 tuần qua
					</p>
				</div>
				<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<span>Ít</span>
					{LEVEL_CLASSES.map((cls, idx) => (
						<span
							key={cls}
							role="img"
							aria-label={`Mức ${idx}`}
							className={cn("size-3 rounded-[3px]", cls)}
						/>
					))}
					<span>Nhiều</span>
				</div>
			</CardHeader>
			<CardContent>
				<TooltipProvider delayDuration={100}>
					<div
						className="grid w-full gap-[3px]"
						style={{
							gridTemplateColumns: `28px repeat(${numWeeks}, 1fr)`,
							gridTemplateRows: `auto repeat(7, 1fr)`,
						}}
					>
						{/* Row 0: month labels */}
						<div />
						{monthLabels.map((m) => (
							<div
								key={`${m.label}-${m.col}`}
								className="truncate pb-1 text-xs text-muted-foreground"
								style={{ gridColumn: `${m.col + 2} / span ${m.span}` }}
							>
								{m.label}
							</div>
						))}

						{/* Rows 1–7: day labels + cells */}
						{DAY_LABELS.map((dayLabel, dayIdx) => (
							<Fragment key={dayLabel}>
								<div
									className="flex items-center pr-1 text-[11px] text-muted-foreground"
									style={{ gridColumn: 1, gridRow: dayIdx + 2 }}
								>
									{dayLabel}
								</div>
								{weeks.map((week, wi) => {
									const cell = week[dayIdx]
									if (!cell) return null
									if (cell.future) {
										return (
											<div
												key={cell.date}
												className="h-[18px] min-w-0 rounded-[3px] bg-transparent"
												style={{ gridColumn: wi + 2, gridRow: dayIdx + 2 }}
											/>
										)
									}
									const label =
										cell.count === 0
											? `Không có hoạt động · ${formatDisplayDate(cell.date)}`
											: `${cell.count} hoạt động · ${formatDisplayDate(cell.date)}`
									return (
										<Tooltip key={cell.date}>
											<TooltipTrigger asChild>
												<div
													role="img"
													aria-label={label}
													className={cn(
														"h-[18px] min-w-0 rounded-[3px] ring-border transition-shadow hover:ring-1",
														LEVEL_CLASSES[cell.level],
													)}
													style={{ gridColumn: wi + 2, gridRow: dayIdx + 2 }}
												/>
											</TooltipTrigger>
											<TooltipContent side="top">{label}</TooltipContent>
										</Tooltip>
									)
								})}
							</Fragment>
						))}
					</div>
				</TooltipProvider>
			</CardContent>
		</Card>
	)
}
