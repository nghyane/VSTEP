import { createFileRoute } from "@tanstack/react-router"
import { Result } from "antd"

export const Route = createFileRoute("/_app/exams/")({
	component: ExamsPage,
})

function ExamsPage() {
	return (
		<Result
			status="info"
			title="Danh sách đề thi"
			subTitle="Trang đang được xây dựng. Backend đã có endpoint import, UI list/CRUD đang trong roadmap."
		/>
	)
}
