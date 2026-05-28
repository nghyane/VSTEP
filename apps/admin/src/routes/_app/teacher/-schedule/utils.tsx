import { Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"
import type { TeacherScheduleItem, TeacherSlotItem } from "#/features/teacher/queries"
import { DayCell, DayHeader } from "./DayCell"
import type { ClassScheduleEvent, EventKind, ScheduleEvent, SlotScheduleEvent } from "./types"

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

export interface WeekRow {
	timeKey: string
	timeLabel: string
	events: ScheduleEvent[]
}

export function startOfWorkWeek(date: Dayjs) {
	return date.subtract((date.day() + 6) % 7, "day").startOf("day")
}

export function buildColumns(
	days: Dayjs[],
	activeEventId: string | null,
	onSelect: (event: ScheduleEvent) => void,
): ColumnsType<WeekRow> {
	return [
		{
			title: "Khung giờ",
			dataIndex: "timeLabel",
			width: 92,
			render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
		},
		...days.map((day, index) => ({
			title: <DayHeader day={day} label={WEEKDAYS[index]} />,
			onCell: () => ({ style: { verticalAlign: "top" } }),
			render: (_: unknown, row: WeekRow) => (
				<DayCell
					events={row.events.filter((event) => event.date === day.format("YYYY-MM-DD"))}
					activeEventId={activeEventId}
					onSelect={onSelect}
				/>
			),
		})),
	]
}

export function buildEvents(
	scheduleItems: TeacherScheduleItem[],
	slots: TeacherSlotItem[],
	kind: EventKind,
	courseId: string,
): ScheduleEvent[] {
	const classEvents = kind === "slot" ? [] : scheduleItems.map(toClassEvent)
	const slotEvents = kind === "class" ? [] : slots.map(toSlotEvent)
	return [...classEvents, ...slotEvents].filter((event) => courseId === "all" || event.courseId === courseId)
}

export function buildRows(events: ScheduleEvent[]): WeekRow[] {
	const map = new Map<string, WeekRow>()
	for (const event of events) {
		const timeKey = `${event.start}-${event.end}`
		const row = map.get(timeKey) ?? { timeKey, timeLabel: timeKey, events: [] }
		row.events.push(event)
		map.set(timeKey, row)
	}
	return Array.from(map.values()).sort((a, b) => a.timeKey.localeCompare(b.timeKey))
}

function toClassEvent(item: TeacherScheduleItem): ClassScheduleEvent {
	return {
		id: `class-${item.id}`,
		kind: "class",
		date: item.date,
		start: item.start_time,
		end: item.end_time,
		courseId: item.course?.id ?? null,
		courseTitle: item.course?.title ?? "Không có khóa",
		topic: item.topic,
		sessionNumber: item.session_number,
		meetUrl: item.course?.livestream_url ?? null,
	}
}

function toSlotEvent(slot: TeacherSlotItem): SlotScheduleEvent {
	const start = dayjs(slot.starts_at)
	const booking = slot.bookings.find((b) => b.status === "booked" || b.status === "completed")
	return {
		id: `slot-${slot.id}`,
		kind: "slot",
		date: start.format("YYYY-MM-DD"),
		start: start.format("HH:mm"),
		end: start.add(slot.duration_minutes, "minute").format("HH:mm"),
		courseId: slot.course?.id ?? null,
		courseTitle: slot.course?.title ?? "Không có khóa",
		studentName: booking?.profile?.account?.full_name ?? null,
		status: slot.status,
		meetUrl: booking?.meet_url ?? null,
	}
}
