import { createFileRoute } from "@tanstack/react-router"
import { Result } from "antd"

export const Route = createFileRoute("/_app/courses/")({
	component: CoursesPage,
})

function CoursesPage() {
	return (
		<Result
			status="info"
			title="Khóa học"
			subTitle="Trang đang được xây dựng. Backend chưa có endpoint Courses CRUD."
		/>
	)
}
