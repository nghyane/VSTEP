import { createFileRoute, Outlet } from "@tanstack/react-router"
import { Sidebar } from "#/components/Sidebar"
import { useAuth } from "#/features/auth/AuthProvider"
import { LoginPage } from "#/features/auth/LoginPage"

export const Route = createFileRoute("/_app")({
	component: AppLayout,
})

function AppLayout() {
	const { isAuthenticated } = useAuth()

	if (!isAuthenticated) {
		return <LoginPage />
	}

	return (
		<div className="flex min-h-screen">
			<Sidebar />
			<main className="flex-1 min-w-0">
				<Outlet />
			</main>
		</div>
	)
}
