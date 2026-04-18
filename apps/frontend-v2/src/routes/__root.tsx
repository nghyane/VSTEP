import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"
import { Toaster } from "#/shared/ui/sonner"

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
			<Toaster
				position="top-right"
				offset={{ top: 72, right: 16 }}
				mobileOffset={{ top: 72, right: 12, left: 12 }}
			/>
		</>
	)
}
