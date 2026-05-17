import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { App as AntdApp, ConfigProvider } from "antd"
import viVN from "antd/locale/vi_VN"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { showError } from "#/components/Toaster"
import { routeTree } from "./routeTree.gen"
import "./styles.css"

let lastNetworkToastAt = 0
function handleQueryError(err: unknown) {
	// Network error = ky/fetch threw without a response (BE down, DNS, offline).
	// HTTP errors (401/403/500…) carry a Response; những lỗi đó để feature tự xử lý.
	const hasResponse = Boolean((err as { response?: Response })?.response)
	if (hasResponse) return
	const now = Date.now()
	if (now - lastNetworkToastAt < 5000) return
	lastNetworkToastAt = now
	showError("Không kết nối được server", "Kiểm tra kết nối hoặc thử lại sau")
}

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { staleTime: 1000 * 60, retry: false },
	},
	queryCache: new QueryCache({ onError: handleQueryError }),
	mutationCache: new MutationCache({ onError: handleQueryError }),
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
