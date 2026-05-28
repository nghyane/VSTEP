import { LeftOutlined, RightOutlined } from "@ant-design/icons"
import { Button, Card, DatePicker, Empty, Flex, Select, Skeleton, Table, Typography } from "antd"
import dayjs from "dayjs"
import { useMemo, useState } from "react"
import { useTeacherScheduleItems, useTeacherSlots } from "#/features/teacher/queries"
import { EventDetailModal } from "./EventDetailModal"
import type { EventKind, ScheduleEvent } from "./types"
import { buildColumns, buildEvents, buildRows, startOfWorkWeek } from "./utils"

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
	const selectedEventId = selectedEvent?.id ?? null
	const columns = useMemo(
		() => buildColumns(days, selectedEventId, setSelectedEvent),
		[days, selectedEventId],
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
