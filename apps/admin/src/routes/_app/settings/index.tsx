import { createFileRoute } from "@tanstack/react-router"
import { Result } from "antd"

export const Route = createFileRoute("/_app/settings/")({
	component: SettingsPage,
})

function SettingsPage() {
	return (
		<Result
			status="info"
			title="Cấu hình hệ thống"
			subTitle="Trang đang được xây dựng. Backend chưa có endpoint System Config editor."
		/>
	)
}
