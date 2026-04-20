import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { Sidebar } from "#/components/Sidebar"
import { OnboardingModal } from "#/features/onboarding/OnboardingModal"
import { useAuth } from "#/lib/auth-store"

export const Route = createFileRoute("/_app")({
	component: AppLayout,
})

function AppLayout() {
	const isAuthenticated = useAuth((s) => s.isAuthenticated)
	const profile = useAuth((s) => s.profile)
	const navigate = useNavigate()

	useEffect(() => {
		if (!isAuthenticated) navigate({ to: "/", search: { auth: "login" } })
	}, [isAuthenticated, navigate])

	if (!isAuthenticated) return null

	return (
		<div className="flex min-h-screen">
			<Sidebar />
			<main className="flex-1 min-w-0">
				<Outlet />
			</main>
			{!profile && <OnboardingModal />}
		</div>
	)
}
