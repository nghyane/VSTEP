import { Fragment } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ActivityHeatmapProps {
	activeDays: string[]
	className?: string
}

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

function formatDateStr(date: Date): string {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, "0")
	const d = String(date.getDate()).padStart(2, "0")
	return `${y}-${m}-${d}`
}

interface Cell {
	date: string
	active: boolean
	future: boolean
}

function buildGrid(activeDays: string[]) {
	const activeSet = new Set(activeDays)
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	const start = new Date(today)
	start.setDate(start.getDate() - 12 * 7)
	const dow = (start.getDay() + 6) % 7
	start.setDate(start.getDate() - dow)

	const weeks: Cell[][] = []
	const cursor = new Date(start)

	while (cursor <= today || weeks.length === 0) {
		const week: Cell[] = []
		for (let d = 0; d < 7; d++) {
			const dateStr = formatDateStr(cursor)
			const future = cursor > today
			week.push({ date: dateStr, active: !future && activeSet.has(dateStr), future })
			cursor.setDate(cursor.getDate() + 1)
		}
		weeks.push(week)
	}

	const monthLabels: { label: string; col: number; span: number }[] = []
	let lastMonth = -1
	for (let w = 0; w < weeks.length; w++) {
		const mondayDate = new Date(weeks[w][0].date)
		const month = mondayDate.getMonth()
		if (month !== lastMonth) {
			if (monthLabels.length > 0) {
				monthLabels[monthLabels.length - 1].span = w - monthLabels[monthLabels.length - 1].col
			}
			monthLabels.push({
				label: mondayDate.toLocaleDateString("vi-VN", { month: "short" }),
				col: w,
				span: 1,
			})
			lastMonth = month
		}
	}
	if (monthLabels.length > 0) {
		monthLabels[monthLabels.length - 1].span =
			weeks.length - monthLabels[monthLabels.length - 1].col
	}

	return { weeks, monthLabels }
}

export function ActivityHeatmap({ activeDays, className }: ActivityHeatmapProps) {
	const { weeks, monthLabels } = buildGrid(activeDays)
	const numWeeks = weeks.length

	const weeklyCounts = weeks.map((week) => week.filter((cell) => cell.active).length)

	return (
		<Card className={cn("border-0 bg-muted/30", className)}>
			<CardHeader className="flex-row items-center justify-between">
				<CardTitle className="text-base">Tần suất học tập</CardTitle>
				<div className="flex items-center gap-3 text-xs text-muted-foreground">
					<span className="flex items-center gap-1.5">
						<span className="size-3 rounded-[3px] bg-muted" />
						Không hoạt động
					</span>
					<span className="flex items-center gap-1.5">
						<span className="size-3 rounded-[3px] bg-primary" />
						Có hoạt động
					</span>
				</div>
			</CardHeader>
			<CardContent>
				<div
					className="grid w-full gap-[3px]"
					style={{
						gridTemplateColumns: `28px repeat(${numWeeks}, 1fr)`,
						gridTemplateRows: `auto repeat(7, 1fr) auto`,
					}}
				>
					{/* Row 0: month labels */}
					<div />
					{/* empty top-left corner */}
					{monthLabels.map((m) => (
						<div
							key={m.label}
							className="truncate pb-1 text-xs text-muted-foreground"
							style={{
								gridColumn: `${m.col + 2} / span ${m.span}`,
							}}
						>
							{m.label}
						</div>
					))}

					{/* Rows 1-7: day labels + cells */}
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
								return (
									<div
										key={cell.date}
										title={cell.date}
										className={cn(
											"h-[18px] min-w-0 rounded-[3px]",
											cell.future ? "bg-transparent" : cell.active ? "bg-primary" : "bg-muted",
										)}
										style={{
											gridColumn: wi + 2,
											gridRow: dayIdx + 2,
										}}
									/>
								)
							})}
						</Fragment>
					))}

					{/* Row 8: "Tổng" + weekly sums */}
					<div
						className="flex items-center pr-1 pt-1 text-[10px] font-medium text-muted-foreground"
						style={{ gridColumn: 1, gridRow: 9 }}
					>
						Tổng
					</div>
					{weeklyCounts.map((count, wi) => (
						<div
							key={`sum-${wi}`}
							className="flex items-center justify-center pt-1 text-[10px] tabular-nums text-muted-foreground"
							style={{ gridColumn: wi + 2, gridRow: 9 }}
						>
							{count > 0 ? count : ""}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
