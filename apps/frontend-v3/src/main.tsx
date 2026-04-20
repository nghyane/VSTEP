import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { handleApiError } from "#/lib/on-error"
import { routeTree } from "./routeTree.gen"
import "./styles.css"

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { staleTime: 1000 * 60 * 5, retry: false },
		mutations: { onError: handleApiError },
	},
})

queryClient.getQueryCache().config.onError = handleApiError
queryClient.getMutationCache().config.onError = handleApiError

const router = createRouter({
	routeTree,
	context: { queryClient },
	defaultPreload: "intent",
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
