import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { ErrorBoundary } from "#/components/ErrorBoundary"
import { Sidebar } from "#/components/Sidebar"
import { useAuth } from "#/lib/auth"

export const Route = createFileRoute("/_app")({
	beforeLoad: () => {
		const { status } = useAuth.getState()
		if (status !== "authenticated") throw redirect({ to: "/", search: { auth: "login" } })
	},
	component: AppLayout,
})

function AppLayout() {
	const status = useAuth((s) => s.status)
	const navigate = useNavigate()

	useEffect(() => {
		if (status !== "authenticated") navigate({ to: "/", search: { auth: "login" } })
	}, [status, navigate])

	if (status !== "authenticated") return null

	return (
		<div className="flex min-h-screen">
			<Sidebar />
			<main className="flex-1 min-w-0">
				<ErrorBoundary>
					<Outlet />
				</ErrorBoundary>
			</main>
		</div>
	)
}
