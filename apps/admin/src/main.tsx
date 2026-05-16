import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { App as AntdApp, ConfigProvider } from "antd"
import viVN from "antd/locale/vi_VN"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { routeTree } from "./routeTree.gen"
import "./styles.css"

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { staleTime: 1000 * 60, retry: false },
	},
})

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

const rootEl = document.getElementById("root")
if (!rootEl) throw new Error("#root missing")

createRoot(rootEl).render(
	<StrictMode>
		<ConfigProvider
			locale={viVN}
			theme={{
				token: {
					colorPrimary: "#2563eb",
					borderRadius: 8,
					fontFamily:
						'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
				},
			}}
		>
			<AntdApp>
				<QueryClientProvider client={queryClient}>
					<RouterProvider router={router} />
				</QueryClientProvider>
			</AntdApp>
		</ConfigProvider>
	</StrictMode>,
)
