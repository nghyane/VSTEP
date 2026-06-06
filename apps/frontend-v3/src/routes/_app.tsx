import { createFileRoute, Outlet, useNavigate, useRouter } from "@tanstack/react-router"
import { useEffect } from "react"
import { ErrorBoundary } from "#/components/ErrorBoundary"
import { Sidebar } from "#/components/Sidebar"
import { EnrollReturnWatcher } from "#/features/course/components/EnrollReturnWatcher"
import { LandingMobileAppNotice } from "#/features/landing/components/LandingMobileAppNotice"
import { WelcomeGiftModal } from "#/features/onboarding/WelcomeGiftModal"
import { useAuth } from "#/lib/auth"
import { requireAuth } from "#/lib/auth-guard"
import { useMediaQuery } from "#/lib/use-media-query"

export const Route = createFileRoute("/_app")({
	beforeLoad: requireAuth,
	component: AppLayout,
})

function AppLayout() {
	const status = useAuth((s) => s.status)
	const user = useAuth((s) => (s.status === "authenticated" ? s.user : null))
	const logout = useAuth((s) => s.logout)
	const navigate = useNavigate()
	const path = useRouter().state.location.pathname
	const isMobile = useMediaQuery("(max-width: 767px)")

	useEffect(() => {
		if (status !== "authenticated") navigate({ to: "/", search: { auth: "login", redirect: path } })
	}, [status, navigate, path])

	if (status !== "authenticated") return null
	if (isMobile && user?.role === "learner")
		return <LandingMobileAppNotice mode="authenticated" onLogout={logout} />

	return (
		<div className="flex min-h-screen">
			<Sidebar />
			<main className="flex-1 min-w-0 flex flex-col">
				<ErrorBoundary>
					<Outlet />
				</ErrorBoundary>
			</main>
			<WelcomeGiftModal />
			<EnrollReturnWatcher />
		</div>
	)
}
