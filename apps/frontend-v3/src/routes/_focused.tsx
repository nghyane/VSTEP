import { createFileRoute, Outlet } from "@tanstack/react-router"
import { ErrorBoundary } from "#/components/ErrorBoundary"

export const Route = createFileRoute("/_focused")({
	component: () => (
		<ErrorBoundary>
			<Outlet />
		</ErrorBoundary>
	),
})
