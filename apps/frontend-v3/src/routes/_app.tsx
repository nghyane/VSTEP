import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router"
import { Sidebar } from "#/components/Sidebar"
import { AuthShell } from "#/features/auth/AuthShell"
import { LoginForm } from "#/features/auth/LoginForm"
import { useAuth } from "#/lib/auth-store"

export const Route = createFileRoute("/_app")({
	component: AppLayout,
})

function AppLayout() {
	const { isAuthenticated } = useAuth()
	const navigate = useNavigate()

	if (!isAuthenticated) {
		return (
			<AuthShell onClose={() => navigate({ to: "/" })}>
				<LoginForm />
			</AuthShell>
		)
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
