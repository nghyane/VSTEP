import { createFileRoute, redirect } from "@tanstack/react-router"
import { Card, Empty, Typography } from "antd"
import { useAuth } from "#/lib/auth"

export const Route = createFileRoute("/_app/teacher/bookings")({
	beforeLoad: () => {
		const user = useAuth.getState().user
		if (!user || user.role !== "teacher") throw redirect({ to: "/" })
	},
	component: TeacherBookings,
})

function TeacherBookings() {
	return (
		<div>
			<Typography.Title level={3}>Buổi học</Typography.Title>
			<Card>
				<Empty description="Chưa có buổi học nào" />
			</Card>
		</div>
	)
}
