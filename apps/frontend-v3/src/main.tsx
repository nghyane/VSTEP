import { QueryClientProvider } from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { SplashLoader } from "#/components/SplashLoader"
import { queryClient } from "#/lib/query-client"
import { routeTree } from "./routeTree.gen"
import "./styles.css"

const router = createRouter({
	routeTree,
	context: { queryClient },
	defaultPreload: "intent",
	defaultPendingComponent: SplashLoader,
	defaultPendingMs: 0,
	defaultPendingMinMs: 300,
})

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	</StrictMode>,
)
