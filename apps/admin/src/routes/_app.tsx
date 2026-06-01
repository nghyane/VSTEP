import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { Layout } from "antd"
import { ErrorBoundary } from "#/components/ErrorBoundary"
import { Sidebar } from "#/components/Sidebar"
import { Topbar } from "#/components/Topbar"
import { useAuth } from "#/lib/auth"

export const Route = createFileRoute("/_app")({
	beforeLoad: ({ location }) => {
		const { token, user } = useAuth.getState()
		if (!token || !user) throw redirect({ to: "/login" })
		if (!["admin", "staff", "teacher"].includes(user.role)) throw redirect({ to: "/login" })

		if (user.role === "teacher" && !location.pathname.startsWith("/teacher")) {
			throw redirect({ to: "/teacher" })
		}
		if (user.role !== "teacher" && location.pathname.startsWith("/teacher")) {
			throw redirect({ to: "/" })
		}
	},
	component: AppLayout,
})

function AppLayout() {
	return (
		<Layout hasSider style={{ minHeight: "100vh" }}>
			<Sidebar />
			<Layout>
				<Topbar />
				<Layout.Content style={{ padding: 24 }}>
					<ErrorBoundary>
						<Outlet />
					</ErrorBoundary>
				</Layout.Content>
			</Layout>
		</Layout>
	)
}
