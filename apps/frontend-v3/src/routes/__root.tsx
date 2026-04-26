import type { QueryClient } from "@tanstack/react-query"
import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router"
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
	notFoundComponent: NotFoundScreen,
})

function NotFoundScreen() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
			<p className="text-6xl font-extrabold text-primary">404</p>
			<h1 className="text-2xl font-extrabold text-foreground">Không tìm thấy trang</h1>
			<p className="max-w-md text-sm text-muted">
				URL này không tồn tại hoặc đã hết hạn. Hãy quay lại sảnh để tiếp tục.
			</p>
			<Link to="/thi-thu" className="btn btn-primary mt-2">
				Về sảnh đề thi
			</Link>
		</div>
	)
}
