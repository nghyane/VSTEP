import { Flex, Typography } from "antd"
import type { Dayjs } from "dayjs"
import { ClassEvent, SlotEvent } from "./EventCard"
import type { ScheduleEvent } from "./types"

export function DayHeader({ day, label }: { day: Dayjs; label: string }) {
	return (
		<Flex vertical gap={0} align="center">
			<Typography.Text strong>{label}</Typography.Text>
			<Typography.Text type="secondary" style={{ fontSize: 12 }}>
				{day.format("DD/MM")}
			</Typography.Text>
		</Flex>
	)
}

export function DayCell({
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
