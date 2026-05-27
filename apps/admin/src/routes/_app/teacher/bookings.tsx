import { createFileRoute, redirect } from "@tanstack/react-router"
import { Card, Empty, Skeleton, Table, Tag, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { type TeacherBookingItem, useTeacherBookings } from "#/features/teacher/queries"
import { useAuth } from "#/lib/auth"

export const Route = createFileRoute("/_app/teacher/bookings")({
	beforeLoad: () => {
		const user = useAuth.getState().user
		if (!user || user.role !== "teacher") throw redirect({ to: "/" })
	},
	component: TeacherBookings,
})

const STATUS_MAP: Record<string, { color: string; label: string }> = {
	booked: { color: "blue", label: "Đã đặt" },
	completed: { color: "green", label: "Hoàn thành" },
	cancelled: { color: "red", label: "Đã hủy" },
}

const columns: ColumnsType<TeacherBookingItem> = [
	{
		title: "Học viên",
		dataIndex: ["profile", "user", "full_name"],
		render: (v) => v ?? "—",
	},
	{
		title: "Khóa học",
		dataIndex: ["slot", "course", "title"],
		render: (v) => v ?? "—",
	},
	{
		title: "Thời gian",
		dataIndex: ["slot", "starts_at"],
		render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
	},
	{
		title: "Trạng thái",
		dataIndex: "status",
		render: (v: string) => {
			const s = STATUS_MAP[v] ?? { color: "default", label: v }
			return <Tag color={s.color}>{s.label}</Tag>
		},
	},
]

function TeacherBookings() {
	const { data, isLoading } = useTeacherBookings()

	return (
		<div>
			<Typography.Title level={3}>Buổi học</Typography.Title>
			<Card>
				{isLoading ? (
					<Skeleton active />
				) : (
					<Table
						rowKey="id"
						columns={columns}
						dataSource={data ?? []}
						locale={{ emptyText: <Empty description="Chưa có buổi học nào" /> }}
						pagination={{ pageSize: 10 }}
					/>
				)}
			</Card>
		</div>
	)
}
