import { Flex, Tag, Typography, theme } from "antd"
import type { ReactNode } from "react"
import { useState } from "react"
import type { ClassScheduleEvent, ScheduleEvent, SlotScheduleEvent } from "./types"

export function ClassEvent({
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

export function SlotEvent({
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
	const [hovered, setHovered] = useState(false)
	const isActive = active || hovered

	return (
		<Flex
			vertical
			gap={2}
			onClick={onClick}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			role="button"
			tabIndex={0}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") onClick()
			}}
			style={{
				minWidth: 0,
				padding: 6,
				borderRadius: token.borderRadius,
				border: `1px solid ${isActive ? token.colorPrimary : token.colorBorderSecondary}`,
				background: isActive ? token.colorPrimaryBg : token.colorBgContainer,
				boxShadow: isActive ? token.boxShadowTertiary : undefined,
				cursor: "pointer",
				transform: hovered ? "translateY(-1px)" : undefined,
				transition:
					"border-color 160ms ease, background 160ms ease, box-shadow 160ms ease, transform 160ms ease",
			}}
		>
			{children}
		</Flex>
	)
}
