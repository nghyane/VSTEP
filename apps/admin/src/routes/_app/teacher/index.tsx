import { CalendarOutlined, ClockCircleOutlined, ScheduleOutlined } from "@ant-design/icons"
import { createFileRoute } from "@tanstack/react-router"
import { Card, Col, Flex, Row, Skeleton, Statistic } from "antd"
import { PageHeader } from "#/components/PageHeader"
import { useTeacherDashboard } from "#/features/teacher/queries"
import { useAuth } from "#/lib/auth"

export const Route = createFileRoute("/_app/teacher/")({
	component: TeacherDashboard,
})

function StatCard({
	title,
	value,
	icon,
	loading,
}: {
	title: string
	value: number
	icon: React.ReactNode
	loading: boolean
}) {
	return (
		<Card>
			{loading ? <Skeleton.Input active block /> : <Statistic title={title} value={value} prefix={icon} />}
		</Card>
	)
}

function TeacherDashboard() {
	const { data, isLoading } = useTeacherDashboard()
	const user = useAuth((s) => s.user)

	return (
		<Flex vertical gap={24}>
			<PageHeader
				title={`Xin chào, ${user?.name ?? "Giáo viên"}`}
				subtitle="Tổng quan lịch dạy, booking và đơn nghỉ."
			/>
			<Row gutter={[16, 16]}>
				<Col xs={24} sm={8}>
					<StatCard
						title="Buổi dạy hôm nay"
						value={data?.today_slots ?? 0}
						icon={<CalendarOutlined />}
						loading={isLoading}
					/>
				</Col>
				<Col xs={24} sm={8}>
					<StatCard
						title="Booking sắp tới"
						value={data?.upcoming_bookings ?? 0}
						icon={<ScheduleOutlined />}
						loading={isLoading}
					/>
				</Col>
				<Col xs={24} sm={8}>
					<StatCard
						title="Đơn nghỉ chờ duyệt"
						value={data?.pending_leaves ?? 0}
						icon={<ClockCircleOutlined />}
						loading={isLoading}
					/>
				</Col>
			</Row>
		</Flex>
	)
}
