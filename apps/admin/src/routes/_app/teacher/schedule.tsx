import { createFileRoute, redirect } from "@tanstack/react-router"
import { Badge, Calendar, Card, Empty, Skeleton, Tag, Typography } from "antd"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useTeacherSlots } from "#/features/teacher/queries"
import { useAuth } from "#/lib/auth"

export const Route = createFileRoute("/_app/teacher/schedule")({
	beforeLoad: () => {
		const user = useAuth.getState().user
		if (!user || user.role !== "teacher") throw redirect({ to: "/" })
	},
	component: TeacherSchedule,
})

function TeacherSchedule() {
	const from = dayjs().startOf("month").format("YYYY-MM-DD")
	const to = dayjs().endOf("month").format("YYYY-MM-DD")
	const { data: slots, isLoading } = useTeacherSlots(from, to)

	const slotsByDate = useMemo(() => {
		const map = new Map<string, typeof slots>()
		for (const slot of slots ?? []) {
			const key = dayjs(slot.starts_at).format("YYYY-MM-DD")
			const arr = map.get(key) ?? []
			arr.push(slot)
			map.set(key, arr)
		}
		return map
	}, [slots])

	function dateCellRender(date: Dayjs) {
		const items = slotsByDate.get(date.format("YYYY-MM-DD"))
		if (!items?.length) return null
		return (
			<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
				{items.slice(0, 3).map((s) => (
					<li key={s.id}>
						<Badge
							status={s.status === "booked" ? "success" : "default"}
							text={dayjs(s.starts_at).format("HH:mm")}
							style={{ fontSize: 11 }}
						/>
					</li>
				))}
				{items.length > 3 && <li style={{ fontSize: 11, color: "#999" }}>+{items.length - 3} nữa</li>}
			</ul>
		)
	}

	return (
		<div>
			<Typography.Title level={3}>Lịch dạy</Typography.Title>
			<Card>
				{isLoading ? (
					<Skeleton active />
				) : (
					<Calendar cellRender={(date, info) => (info.type === "date" ? dateCellRender(date) : null)} />
				)}
			</Card>
		</div>
	)
}
