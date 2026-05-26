import { createFileRoute, Outlet } from "@tanstack/react-router"
import { ErrorBoundary } from "#/components/ErrorBoundary"
import { requireAuth } from "#/lib/auth-guard"

export const Route = createFileRoute("/_focused")({
	beforeLoad: requireAuth,
	component: () => (
		<ErrorBoundary>
			<Outlet />
		</ErrorBoundary>
	),
})
