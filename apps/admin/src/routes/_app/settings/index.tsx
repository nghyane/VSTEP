import { createFileRoute, redirect } from "@tanstack/react-router"
import { Result } from "antd"
import { useAuth } from "#/lib/auth"
import { SettingsPage } from "./-settings/SettingsPage"

export const Route = createFileRoute("/_app/settings/")({
	beforeLoad: () => {
		const user = useAuth.getState().user
		if (!user || user.role !== "admin") {
			throw redirect({ to: "/" })
		}
	},
	component: SettingsRoute,
})

function SettingsRoute() {
	const user = useAuth((s) => s.user)
	if (!user || user.role !== "admin") {
		return (
			<Result status="403" title="Không có quyền truy cập" subTitle="Cấu hình hệ thống chỉ dành cho Admin." />
		)
	}
	return <SettingsPage />
}
