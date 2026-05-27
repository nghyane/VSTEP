import { createFileRoute, redirect } from "@tanstack/react-router"
import { Card, Col, Row, Statistic, Typography } from "antd"
import { CalendarOutlined, ScheduleOutlined } from "@ant-design/icons"
import { useAuth } from "#/lib/auth"

export const Route = createFileRoute("/_app/teacher/")({
	beforeLoad: () => {
		const user = useAuth.getState().user
		if (!user || user.role !== "teacher") throw redirect({ to: "/" })
	},
	component: TeacherDashboard,
})

function TeacherDashboard() {
	return (
		<div>
			<Typography.Title level={3}>Dashboard giáo viên</Typography.Title>
			<Row gutter={[16, 16]}>
				<Col xs={24} sm={12}>
					<Card>
						<Statistic title="Buổi dạy hôm nay" value={0} prefix={<CalendarOutlined />} />
					</Card>
				</Col>
				<Col xs={24} sm={12}>
					<Card>
						<Statistic title="Booking sắp tới" value={0} prefix={<ScheduleOutlined />} />
					</Card>
				</Col>
			</Row>
		</div>
	)
}
