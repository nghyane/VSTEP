import { createFileRoute, redirect } from "@tanstack/react-router"
import { AdminLayout } from "@/components/layouts/AdminLayout"
import { isAuthenticated, user } from "@/lib/auth"

export const Route = createFileRoute("/admin")({
	beforeLoad: () => {
		if (!isAuthenticated()) throw redirect({ to: "/login" })
		const u = user()
		if (u?.role !== "admin") throw redirect({ to: "/dashboard" })
	},
	component: AdminLayout,
})
