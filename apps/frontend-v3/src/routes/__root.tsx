import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { Toaster } from "#/components/Toaster"
import { initAuth, useAuth } from "#/lib/auth"

interface RouterContext {
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
	beforeLoad: async () => {
		if (useAuth.getState().status === "idle") {
			await initAuth()
		}
	},
	component: () => (
		<>
			<Outlet />
			<Toaster />
		</>
	),
})
