import { CalendarOutlined, ClockCircleOutlined, ScheduleOutlined } from "@ant-design/icons"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { Card, Col, Row, Skeleton, Statistic, Typography } from "antd"
import { useTeacherDashboard } from "#/features/teacher/queries"
import { useAuth } from "#/lib/auth"

export const Route = createFileRoute("/_app/teacher/")({
	beforeLoad: () => {
		const user = useAuth.getState().user
		if (!user || user.role !== "teacher") throw redirect({ to: "/" })
	},
	component: TeacherDashboard,
})

function TeacherDashboard() {
	const { data, isLoading } = useTeacherDashboard()
	const user = useAuth((s) => s.user)

	return (
		<div>
			<Typography.Title level={3}>Xin chào, {user?.name ?? "Giáo viên"}</Typography.Title>
			<Row gutter={[16, 16]}>
				<Col xs={24} sm={8}>
					<Card>
						{isLoading ? (
							<Skeleton.Input active block />
						) : (
							<Statistic
								title="Buổi dạy hôm nay"
								value={data?.today_slots ?? 0}
								prefix={<CalendarOutlined />}
							/>
						)}
					</Card>
				</Col>
				<Col xs={24} sm={8}>
					<Card>
						{isLoading ? (
							<Skeleton.Input active block />
						) : (
							<Statistic
								title="Booking sắp tới"
								value={data?.upcoming_bookings ?? 0}
								prefix={<ScheduleOutlined />}
							/>
						)}
					</Card>
				</Col>
				<Col xs={24} sm={8}>
					<Card>
						{isLoading ? (
							<Skeleton.Input active block />
						) : (
							<Statistic
								title="Đơn nghỉ chờ duyệt"
								value={data?.pending_leaves ?? 0}
								prefix={<ClockCircleOutlined />}
							/>
						)}
					</Card>
				</Col>
			</Row>
		</div>
	)
}
