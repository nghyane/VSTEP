import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { Sidebar } from "#/components/Sidebar"
import { Topbar } from "#/components/Topbar"
import { useAuth } from "#/lib/auth"

export const Route = createFileRoute("/_app")({
	beforeLoad: () => {
		const { token, user } = useAuth.getState()
		if (!token || !user) throw redirect({ to: "/login" })
		if (!["admin", "staff", "teacher"].includes(user.role)) throw redirect({ to: "/login" })
	},
	component: AppLayout,
})

function AppLayout() {
	return (
		<div className="flex min-h-screen">
			<Sidebar />
			<div className="flex min-w-0 flex-1 flex-col">
				<Topbar />
				<main className="flex-1 overflow-y-auto p-6">
					<Outlet />
				</main>
			</div>
		</div>
	)
}
