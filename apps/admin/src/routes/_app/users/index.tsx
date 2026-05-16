import { createFileRoute } from "@tanstack/react-router"
import { Result } from "antd"

export const Route = createFileRoute("/_app/users/")({
	component: UsersPage,
})

function UsersPage() {
	return (
		<Result
			status="info"
			title="Quản lý người dùng"
			subTitle="Trang đang được xây dựng. Backend chưa có endpoint Users CRUD (theo RFC 0015 roadmap)."
		/>
	)
}
