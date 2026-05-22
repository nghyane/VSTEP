import { useMemo } from "react"
import { Icon } from "#/components/Icon"
import { ScrollArea } from "#/components/ScrollArea"
import type { BookingSlot, SlotStatus } from "#/features/booking/types"
import { cn, isSameDay } from "#/lib/utils"

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const

interface Props {
	slots: BookingSlot[]
	weekStartMs: number
	locked: boolean
	onSelect: (slot: BookingSlot) => void
}

interface CellSpec {
	dateMs: number
	timeKey: string
	hour: number
	minute: number
	slot: BookingSlot | null
	isToday: boolean
}

export function SlotGrid({ slots, weekStartMs, locked, onSelect }: Props) {
	const now = Date.now()
	const grid = useMemo(() => buildGrid(slots, weekStartMs, now), [slots, weekStartMs, now])
	const days = grid.days
	const timeRows = grid.timeRows

	if (timeRows.length === 0) {
		return <div className="card p-8 text-center text-sm text-muted">Tuần này chưa có khung giờ trống.</div>
	}

	return (
		<div className="overflow-x-auto rounded-(--radius-card) border-2 border-b-4 border-border bg-background">
			<div className="min-w-[720px]">
				<div
					className="grid border-b-2 border-border bg-surface"
					style={{ gridTemplateColumns: "72px repeat(7, minmax(0, 1fr))" }}
				>
					<div className="px-2 py-2.5 flex items-center justify-center text-[10px] font-extrabold uppercase tracking-wider text-muted">
						Giờ
					</div>
					{days.map((d) => (
						<div
							key={d.dateMs}
							className={cn(
								"px-2 py-2.5 text-center flex flex-col items-center justify-center gap-0.5",
								d.isToday && "bg-primary-tint/60",
							)}
						>
							<div
								className={cn(
									"text-[10px] font-extrabold uppercase tracking-wider",
									d.isToday ? "text-primary-dark" : "text-muted",
								)}
							>
								{d.label}
							</div>
							<div
								className={cn(
									"text-sm font-extrabold tabular-nums",
									d.isToday ? "text-primary-dark" : "text-foreground",
								)}
							>
								{pad(d.dayNum)}/{pad(d.monthNum)}
							</div>
						</div>
					))}
				</div>

				<ScrollArea maxHeight={480}>
					{timeRows.map((row) => (
						<div
							key={row.timeKey}
							className="grid border-t-2 border-border first:border-t-0"
							style={{ gridTemplateColumns: "72px repeat(7, minmax(0, 1fr))" }}
						>
							<div className="px-2 py-3 flex items-center justify-center text-xs font-extrabold tabular-nums text-muted">
								{row.label}
							</div>
							{row.cells.map((cell) => (
								<SlotCell
									key={`${cell.timeKey}-${cell.dateMs}`}
									cell={cell}
									locked={locked}
									onSelect={onSelect}
								/>
							))}
						</div>
					))}
				</ScrollArea>
			</div>
		</div>
	)
}

function SlotCell({
	cell,
	locked,
	onSelect,
}: {
	cell: CellSpec
	locked: boolean
	onSelect: (slot: BookingSlot) => void
}) {
	const slot = cell.slot
	if (!slot) {
		return (
			<div
				className={cn("min-h-14 border-l-2 border-border/60 p-1.5", cell.isToday && "bg-primary-tint/20")}
			/>
		)
	}
	const status = slot.status
	const styles = STATUS_STYLES[status]
	// Locked: chặn click "available". `booked_me` vẫn cho xem chi tiết (read-only, không tốn xu).
	const interactive = (!locked && status === "available") || status === "booked_me"
	return (
		<div
			className={cn(
				"min-h-14 border-l-2 border-border/60 p-1.5",
				cell.isToday && status === "available" && "bg-primary-tint/20",
			)}
		>
			<button
				type="button"
				disabled={!interactive}
				onClick={() => interactive && onSelect(slot)}
				aria-label={`${cell.timeKey} ${formatStatusLabel(status)}`}
				className={cn(
					"group h-full w-full rounded-xl px-2 py-1.5 flex items-center justify-center text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
					styles.base,
					interactive && "cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:border-b-2",
					!interactive && "cursor-not-allowed",
				)}
			>
				<span className={cn("inline-flex items-center gap-1 text-[11px] font-extrabold", styles.label)}>
					{styles.icon && <Icon name={styles.icon} size="xs" className="h-3 w-auto" />}
					{styles.text}
				</span>
			</button>
		</div>
	)
}

const STATUS_STYLES: Record<
	SlotStatus,
	{
		base: string
		label: string
		text: string
		icon: "check" | "close" | "lightning" | null
	}
> = {
	available: {
		base: "bg-primary-tint border-2 border-b-4 border-primary/30 hover:bg-primary-tint hover:border-primary/50",
		label: "text-primary-dark",
		text: "Trống",
		icon: "lightning",
	},
	booked_me: {
		base: "bg-success-tint border-2 border-b-4 border-success/40 hover:border-success/60",
		label: "text-success",
		text: "Lịch của bạn",
		icon: "check",
	},
	booked_other: {
		base: "bg-border/40 border-2 border-border/50",
		label: "text-muted/80",
		text: "Đã đặt",
		icon: null,
	},
	past: {
		base: "bg-surface border-2 border-border/40 opacity-50",
		label: "text-muted/70",
		text: "—",
		icon: null,
	},
}

function formatStatusLabel(status: SlotStatus): string {
	switch (status) {
		case "available":
			return "trống"
		case "booked_me":
			return "đã đặt bởi bạn"
		case "booked_other":
			return "đã có người đặt"
		case "past":
			return "đã qua"
	}
}

interface DayHeader {
	dateMs: number
	dayNum: number
	monthNum: number
	label: string
	isToday: boolean
}

interface TimeRow {
	timeKey: string
	label: string
	cells: CellSpec[]
}

function buildGrid(
	slots: BookingSlot[],
	weekStartMs: number,
	now: number,
): { days: DayHeader[]; timeRows: TimeRow[] } {
	const days: DayHeader[] = []
	const cursor = new Date(weekStartMs)
	for (let i = 0; i < 7; i++) {
		days.push({
			dateMs: cursor.getTime(),
			dayNum: cursor.getDate(),
			monthNum: cursor.getMonth() + 1,
			label: DAY_LABELS[i],
			isToday: isSameDay(cursor.getTime(), now),
		})
		cursor.setDate(cursor.getDate() + 1)
	}

	const weekEnd = new Date(weekStartMs)
	weekEnd.setDate(weekEnd.getDate() + 7)
	const weekEndMs = weekEnd.getTime()

	const inWeek = slots.filter((s) => {
		const t = new Date(s.starts_at).getTime()
		return t >= weekStartMs && t < weekEndMs
	})

	const timeKeys = new Set<string>()
	for (const s of inWeek) {
		const d = new Date(s.starts_at)
		timeKeys.add(`${pad(d.getHours())}:${pad(d.getMinutes())}`)
	}
	const sortedKeys = [...timeKeys].sort()
	const timeRows: TimeRow[] = sortedKeys.map((tk) => ({
		timeKey: tk,
		label: tk,
		cells: days.map((d) => ({
			dateMs: d.dateMs,
			timeKey: tk,
			hour: Number.parseInt(tk.slice(0, 2), 10),
			minute: Number.parseInt(tk.slice(3, 5), 10),
			slot: null,
			isToday: d.isToday,
		})),
	}))
	const rowMap = new Map(timeRows.map((r) => [r.timeKey, r]))
	for (const s of inWeek) {
		const d = new Date(s.starts_at)
		const tk = `${pad(d.getHours())}:${pad(d.getMinutes())}`
		const row = rowMap.get(tk)
		if (!row) continue
		const colIdx = days.findIndex((day) => isSameDay(day.dateMs, d.getTime()))
		if (colIdx < 0) continue
		row.cells[colIdx] = { ...row.cells[colIdx], slot: s }
	}
	return { days, timeRows }
}

function pad(n: number): string {
	return String(n).padStart(2, "0")
}
