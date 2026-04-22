import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { Toaster } from "#/components/Toaster"
import { initAuth } from "#/lib/auth"

interface RouterContext {
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
	loader: () => initAuth(),
	component: () => (
		<>
			<Outlet />
			<Toaster />
		</>
	),
})
