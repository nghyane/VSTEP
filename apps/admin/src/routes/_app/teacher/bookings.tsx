import { LinkOutlined } from "@ant-design/icons"
import { createFileRoute } from "@tanstack/react-router"
import { Empty, Flex, Skeleton, Table, Tag, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"
import { PageHeader } from "#/components/PageHeader"
import { type TeacherBookingItem, useTeacherBookings } from "#/features/teacher/queries"

export const Route = createFileRoute("/_app/teacher/bookings")({
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
		dataIndex: ["profile", "account", "full_name"],
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
		title: "Google Meet",
		dataIndex: "meet_url",
		render: (v: string | null) =>
			v ? (
				<Typography.Link href={v} target="_blank" rel="noreferrer" ellipsis>
					<LinkOutlined /> {v}
				</Typography.Link>
			) : (
				<Typography.Text type="secondary">—</Typography.Text>
			),
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
		<Flex vertical gap={24}>
			<PageHeader title="Buổi học" subtitle="Danh sách học viên đã đặt lịch 1-1 với bạn." />
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
		</Flex>
	)
}
