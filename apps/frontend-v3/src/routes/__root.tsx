import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import type { useAuth } from "#/features/auth/AuthProvider"

interface RouterContext {
	queryClient: QueryClient
	auth: ReturnType<typeof useAuth>
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: () => <Outlet />,
})
