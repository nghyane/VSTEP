import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { App as AntdApp, ConfigProvider } from "antd"
import viVN from "antd/locale/vi_VN"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { showError } from "#/components/Toaster"
import { extractError } from "#/lib/api"
import { routeTree } from "./routeTree.gen"
import "./styles.css"

// Dedupe toast khi nhiều query/mutation fail cùng lúc (BE down → mọi query fail).
let lastToastAt = 0
function toastDeduped(message: string): void {
	const now = Date.now()
	if (now - lastToastAt < 3000) return
	lastToastAt = now
	showError(message)
}

/**
 * Queries không có catch ở feature → global toast cho mọi lỗi.
 * - 401 đã được api.ts xử lý (clearAuth + redirect /login), bỏ qua.
 * - 422 trên query rất hiếm; vẫn toast để debug.
 */
async function handleQueryError(err: unknown): Promise<void> {
	const status = (err as { response?: Response })?.response?.status
	if (status === 401) return
	const x = await extractError(err)
	toastDeduped(x.message)
}

/**
 * Mutations có catch ở feature (form/list) → global CHỈ toast lỗi mạng.
 * HTTP errors để feature tự hiển thị (field-level errors, banner đỏ trong modal, v.v.).
 */
function handleMutationError(err: unknown): void {
	const hasResponse = Boolean((err as { response?: Response })?.response)
	if (hasResponse) return
	toastDeduped("Không kết nối được server. Kiểm tra kết nối và thử lại.")
}

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { staleTime: 1000 * 60, retry: false },
	},
	queryCache: new QueryCache({ onError: handleQueryError }),
	mutationCache: new MutationCache({ onError: handleMutationError }),
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
