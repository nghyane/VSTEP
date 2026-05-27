import { LeftOutlined, RightOutlined } from "@ant-design/icons"
import { Button, Card, DatePicker, Empty, Flex, Select, Skeleton, Table, Tag, Typography, theme } from "antd"
import type { ColumnsType } from "antd/es/table"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import {
	type TeacherScheduleItem,
	type TeacherSlotItem,
	useTeacherScheduleItems,
	useTeacherSlots,
} from "#/features/teacher/queries"
import { EventDetailModal } from "./EventDetailModal"
import type { ClassScheduleEvent, EventKind, ScheduleEvent, SlotScheduleEvent } from "./types"

interface WeekRow {
	timeKey: string
	timeLabel: string
	events: ScheduleEvent[]
}

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

export function ScheduleCalendar() {
	const [weekDate, setWeekDate] = useState(() => dayjs())
	const [kind, setKind] = useState<EventKind>("all")
	const [courseId, setCourseId] = useState("all")
	const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null)
	const weekStart = startOfWorkWeek(weekDate)
	const weekEnd = weekStart.add(6, "day").endOf("day")
	const from = weekStart.startOf("day").format("YYYY-MM-DDTHH:mm:ssZ")
	const to = weekEnd.format("YYYY-MM-DDTHH:mm:ssZ")
	const { data: slots, isLoading } = useTeacherSlots(from, to)
	const { data: scheduleItems, isLoading: scheduleLoading } = useTeacherScheduleItems(from, to)
	const days = Array.from({ length: 7 }, (_, index) => weekStart.add(index, "day"))

	const courseOptions = useMemo(() => {
		const map = new Map<string, string>()
		for (const item of scheduleItems ?? []) if (item.course) map.set(item.course.id, item.course.title)
		for (const slot of slots ?? []) if (slot.course) map.set(slot.course.id, slot.course.title)
		return [
			{ label: "Tất cả khóa", value: "all" },
			...Array.from(map, ([value, label]) => ({ value, label })),
		]
	}, [scheduleItems, slots])

	const events = useMemo(
		() => buildEvents(scheduleItems ?? [], slots ?? [], kind, courseId),
		[scheduleItems, slots, kind, courseId],
	)

	const rows = useMemo(() => buildRows(events), [events])
	const columns = useMemo(
		() => buildColumns(days, selectedEvent?.id ?? null, setSelectedEvent),
		[days, selectedEvent],
	)
	const loading = isLoading || scheduleLoading

	return (
		<Card>
			<Flex vertical gap={12}>
				<Flex justify="space-between" align="center" wrap gap={12}>
					<Flex align="center" gap={8} wrap>
						<Button
							size="small"
							icon={<LeftOutlined />}
							onClick={() => setWeekDate((d) => d.subtract(1, "week"))}
						>
							Tuần trước
						</Button>
						<DatePicker
							size="small"
							picker="week"
							value={weekDate}
							onChange={(value) => value && setWeekDate(value)}
							allowClear={false}
							style={{ width: 140 }}
						/>
						<Button
							size="small"
							icon={<RightOutlined />}
							onClick={() => setWeekDate((d) => d.add(1, "week"))}
						>
							Tuần sau
						</Button>
					</Flex>
					<Flex align="center" gap={8} wrap>
						<Select
							size="small"
							value={kind}
							onChange={setKind}
							style={{ width: 130 }}
							options={[
								{ label: "Tất cả lịch", value: "all" },
								{ label: "Lớp học", value: "class" },
								{ label: "1-1", value: "slot" },
							]}
						/>
						<Select
							size="small"
							value={courseId}
							onChange={setCourseId}
							style={{ width: 220 }}
							options={courseOptions}
						/>
					</Flex>
				</Flex>

				<Typography.Text type="secondary">
					Tuần {weekStart.format("DD/MM/YYYY")} - {weekEnd.format("DD/MM/YYYY")}
				</Typography.Text>

				{loading ? (
					<Skeleton active />
				) : rows.length === 0 ? (
					<Empty description="Không có lịch trong tuần này" />
				) : (
					<Table
						size="small"
						rowKey="timeKey"
						columns={columns}
						dataSource={rows}
						pagination={false}
						tableLayout="fixed"
					/>
				)}
			</Flex>
			<EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
		</Card>
	)
}

function buildColumns(
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

function buildEvents(
	scheduleItems: TeacherScheduleItem[],
	slots: TeacherSlotItem[],
	kind: EventKind,
	courseId: string,
): ScheduleEvent[] {
	const classEvents = kind === "slot" ? [] : scheduleItems.map(toClassEvent)
	const slotEvents = kind === "class" ? [] : slots.map(toSlotEvent)
	return [...classEvents, ...slotEvents].filter((event) => courseId === "all" || event.courseId === courseId)
}

function buildRows(events: ScheduleEvent[]): WeekRow[] {
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

function DayHeader({ day, label }: { day: Dayjs; label: string }) {
	return (
		<Flex vertical gap={0} align="center">
			<Typography.Text strong>{label}</Typography.Text>
			<Typography.Text type="secondary" style={{ fontSize: 12 }}>
				{day.format("DD/MM")}
			</Typography.Text>
		</Flex>
	)
}

function DayCell({
	events,
	activeEventId,
	onSelect,
}: {
	events: ScheduleEvent[]
	activeEventId: string | null
	onSelect: (event: ScheduleEvent) => void
}) {
	if (events.length === 0) return <Typography.Text type="secondary">-</Typography.Text>
	return (
		<Flex vertical gap={6}>
			{events.map((event) =>
				event.kind === "class" ? (
					<ClassEvent key={event.id} event={event} active={activeEventId === event.id} onSelect={onSelect} />
				) : (
					<SlotEvent key={event.id} event={event} active={activeEventId === event.id} onSelect={onSelect} />
				),
			)}
		</Flex>
	)
}

function ClassEvent({
	event,
	active,
	onSelect,
}: {
	event: ClassScheduleEvent
	active: boolean
	onSelect: (event: ScheduleEvent) => void
}) {
	return (
		<EventCard active={active} onClick={() => onSelect(event)}>
			<Tag color="blue" style={{ marginInlineEnd: 0, width: "fit-content" }}>
				Lớp
			</Tag>
			<Typography.Text strong style={{ fontSize: 13 }}>
				Buổi {event.sessionNumber.toString().padStart(2, "0")}
			</Typography.Text>
			<Typography.Paragraph type="secondary" ellipsis={{ rows: 1 }} style={{ margin: 0, fontSize: 12 }}>
				{event.courseTitle}
			</Typography.Paragraph>
			<Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, fontSize: 12 }}>
				{event.topic}
			</Typography.Paragraph>
		</EventCard>
	)
}

function SlotEvent({
	event,
	active,
	onSelect,
}: {
	event: SlotScheduleEvent
	active: boolean
	onSelect: (event: ScheduleEvent) => void
}) {
	return (
		<EventCard active={active} onClick={() => onSelect(event)}>
			<Tag
				color={event.status === "booked" ? "green" : undefined}
				style={{ marginInlineEnd: 0, width: "fit-content" }}
			>
				1-1
			</Tag>
			<Typography.Paragraph type="secondary" ellipsis={{ rows: 1 }} style={{ margin: 0, fontSize: 12 }}>
				{event.courseTitle}
			</Typography.Paragraph>
			{event.studentName && <Typography.Text>{event.studentName}</Typography.Text>}
		</EventCard>
	)
}

function EventCard({
	active,
	onClick,
	children,
}: {
	active: boolean
	onClick: () => void
	children: ReactNode
}) {
	const { token } = theme.useToken()
	return (
		<Flex
			vertical
			gap={2}
			onClick={onClick}
			role="button"
			tabIndex={0}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") onClick()
			}}
			style={{
				minWidth: 0,
				padding: 6,
				borderRadius: token.borderRadius,
				border: `1px solid ${active ? token.colorPrimary : token.colorBorderSecondary}`,
				background: active ? token.colorPrimaryBg : token.colorBgContainer,
				boxShadow: active ? token.boxShadowTertiary : undefined,
				cursor: "pointer",
				transition:
					"border-color 160ms ease, background 160ms ease, box-shadow 160ms ease, transform 160ms ease",
			}}
			onMouseEnter={(event) => {
				event.currentTarget.style.borderColor = token.colorPrimary
				event.currentTarget.style.boxShadow = token.boxShadowTertiary
				event.currentTarget.style.transform = "translateY(-1px)"
			}}
			onMouseLeave={(event) => {
				event.currentTarget.style.borderColor = active ? token.colorPrimary : token.colorBorderSecondary
				event.currentTarget.style.boxShadow = active ? token.boxShadowTertiary : ""
				event.currentTarget.style.transform = ""
			}}
		>
			{children}
		</Flex>
	)
}

function startOfWorkWeek(date: Dayjs) {
	return date.subtract((date.day() + 6) % 7, "day").startOf("day")
}
