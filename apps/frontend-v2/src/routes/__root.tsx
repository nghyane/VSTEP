import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { Toaster } from "#/components/ui/sonner"

export interface RouterContext {
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
})

function RootComponent() {
	return (
		<>
			<Outlet />
			<Toaster position="top-right" />
		</>
	)
}
