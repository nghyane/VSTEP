import { createFileRoute } from "@tanstack/react-router"
import { Flex } from "antd"
import { PageHeader } from "#/components/PageHeader"
import { ScheduleCalendar } from "./-schedule/ScheduleCalendar"

export const Route = createFileRoute("/_app/teacher/schedule")({
	component: TeacherSchedule,
})

function TeacherSchedule() {
	return (
		<Flex vertical gap={24}>
			<PageHeader title="Lịch dạy" subtitle="Lịch học chung và lịch 1-1 theo tuần." />
			<ScheduleCalendar />
		</Flex>
	)
}
