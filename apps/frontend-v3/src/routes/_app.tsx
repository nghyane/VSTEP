import { createFileRoute, Outlet, redirect, useNavigate, useRouter } from "@tanstack/react-router"
import { useEffect } from "react"
import { ErrorBoundary } from "#/components/ErrorBoundary"
import { Sidebar } from "#/components/Sidebar"
import { WelcomeGiftModal } from "#/features/onboarding/WelcomeGiftModal"
import { useAuth } from "#/lib/auth"

export const Route = createFileRoute("/_app")({
	beforeLoad: ({ location }) => {
		const { status } = useAuth.getState()
		if (status !== "authenticated") {
			throw redirect({ to: "/", search: { auth: "login", redirect: location.pathname } })
		}
	},
	component: AppLayout,
})

function AppLayout() {
	const status = useAuth((s) => s.status)
	const navigate = useNavigate()
	const path = useRouter().state.location.pathname

	useEffect(() => {
		if (status !== "authenticated") navigate({ to: "/", search: { auth: "login", redirect: path } })
	}, [status, navigate, path])

	if (status !== "authenticated") return null

	return (
		<div className="flex min-h-screen">
			<Sidebar />
			<main className="flex-1 min-w-0">
				<ErrorBoundary>
					<Outlet />
				</ErrorBoundary>
			</main>
			<WelcomeGiftModal />
		</div>
	)
}
