import { createFileRoute, Outlet } from "@tanstack/react-router"

// Layout cho /luyen-tap/ky-nang/nghe/*. Index = list đề, $exerciseId = session.
export const Route = createFileRoute("/_app/luyen-tap/ky-nang/nghe")({
	component: NgheLayout,
})

function NgheLayout() {
	return <Outlet />
}
