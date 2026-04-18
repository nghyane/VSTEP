// Grid lịch học dạng tuần × ngày (Mon → Sun), giống thời khóa biểu.
// Tự fill từ Monday trước session đầu đến Sunday sau session cuối.
// Mỗi cell ngày học: primary bg + số buổi + giờ + chủ đề.
// Mỗi cell không học: muted, chỉ hiện số ngày để user biết bối cảnh.

import type { Course, CourseSession } from "#/mocks/courses"
import { cn } from "#/shared/lib/utils"

interface Props {
	course: Course
}

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const
const MS_PER_DAY = 1000 * 60 * 60 * 24

export function CourseSchedule({ course }: Props) {
	const weeks = buildWeeks(course.sessions)
	const now = Date.now()

	return (
		<section className="rounded-2xl bg-muted/50 p-5 shadow-sm">
			<div className="flex items-center justify-between">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Lịch học chi tiết
				</h2>
				<span className="text-xs text-muted-foreground">{course.sessions.length} buổi</span>
			</div>

			<div className="mt-4 overflow-hidden rounded-xl border bg-background">
				{/* Weekday header */}
				<div className="grid grid-cols-7 border-b bg-muted/30 text-center">
					{WEEKDAY_LABELS.map((label) => (
						<div
							key={label}
							className="py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
						>
							{label}
						</div>
					))}
				</div>

				{/* Day grid */}
				<div className="grid grid-cols-7 divide-x divide-y divide-border">
					{weeks.flat().map((cell) => (
						<DayCell key={cell.dateISO} cell={cell} now={now} />
					))}
				</div>
			</div>
		</section>
	)
}

// ─── Cell ────────────────────────────────────────────────────────────────────

interface DayCellData {
	dateISO: string
	dayOfMonth: number
	session: CourseSession | null
}

function DayCell({ cell, now }: { cell: DayCellData; now: number }) {
	const cellTime = new Date(cell.dateISO).getTime()
	const isPast = cellTime < now - MS_PER_DAY // hôm nay vẫn tính là chưa qua

	if (!cell.session) {
		return (
			<div className="min-h-24 p-2 text-right">
				<span className="text-xs font-medium text-muted-foreground/50 tabular-nums">
					{String(cell.dayOfMonth).padStart(2, "0")}
				</span>
			</div>
		)
	}

	const s = cell.session
	return (
		<div
			className={cn(
				"min-h-24 p-2 transition-colors",
				isPast ? "bg-muted/40 hover:bg-muted/60" : "bg-primary/5 hover:bg-primary/15",
			)}
		>
			<div className="flex items-baseline justify-between">
				<span
					className={cn(
						"text-[10px] font-bold uppercase tracking-wider tabular-nums",
						isPast ? "text-muted-foreground" : "text-primary",
					)}
				>
					Buổi {String(s.sessionNumber).padStart(2, "0")}
				</span>
				<span className="text-[11px] font-medium text-muted-foreground tabular-nums">
					{String(cell.dayOfMonth).padStart(2, "0")}
				</span>
			</div>
			<p
				className={cn(
					"mt-1 text-[11px] font-semibold leading-tight tabular-nums",
					isPast && "line-through",
				)}
			>
				{s.startTime}–{s.endTime}
			</p>
			<p
				className={cn(
					"mt-0.5 text-[11px] leading-tight",
					isPast ? "text-muted-foreground" : "text-foreground",
				)}
			>
				{s.topic}
			</p>
		</div>
	)
}

// ─── Build weeks ─────────────────────────────────────────────────────────────

function buildWeeks(sessions: readonly CourseSession[]): DayCellData[][] {
	if (sessions.length === 0) return []

	const byDate = new Map<string, CourseSession>()
	for (const s of sessions) byDate.set(s.date, s)

	const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))
	// biome-ignore lint/style/noNonNullAssertion: sorted is non-empty
	const firstDate = new Date(sorted[0]!.date)
	// biome-ignore lint/style/noNonNullAssertion: sorted is non-empty
	const lastDate = new Date(sorted[sorted.length - 1]!.date)

	const gridStart = snapToMonday(firstDate)
	const gridEnd = snapToSunday(lastDate)

	const weeks: DayCellData[][] = []
	const current = new Date(gridStart)
	while (current.getTime() <= gridEnd.getTime()) {
		const week: DayCellData[] = []
		for (let i = 0; i < 7; i++) {
			const iso = toISODate(current)
			week.push({
				dateISO: iso,
				dayOfMonth: current.getDate(),
				session: byDate.get(iso) ?? null,
			})
			current.setDate(current.getDate() + 1)
		}
		weeks.push(week)
	}

	return weeks
}

function snapToMonday(d: Date): Date {
	const result = new Date(d)
	const dow = result.getDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
	const diff = dow === 0 ? -6 : 1 - dow
	result.setDate(result.getDate() + diff)
	result.setHours(0, 0, 0, 0)
	return result
}

function snapToSunday(d: Date): Date {
	const result = new Date(d)
	const dow = result.getDay()
	const diff = dow === 0 ? 0 : 7 - dow
	result.setDate(result.getDate() + diff)
	result.setHours(23, 59, 59, 999)
	return result
}

function toISODate(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
