import { createFileRoute, redirect } from "@tanstack/react-router"
import { Typography } from "antd"
import { useAuth } from "#/lib/auth"
import { ScheduleCalendar } from "./-schedule/ScheduleCalendar"

export const Route = createFileRoute("/_app/teacher/schedule")({
	beforeLoad: () => {
		const user = useAuth.getState().user
		if (!user || user.role !== "teacher") throw redirect({ to: "/" })
	},
	component: TeacherSchedule,
})

function TeacherSchedule() {
	return (
		<div>
			<Typography.Title level={3}>Lịch dạy</Typography.Title>
			<ScheduleCalendar />
		</div>
	)
}
