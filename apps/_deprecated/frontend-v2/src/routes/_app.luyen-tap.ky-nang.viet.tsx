import { createFileRoute, Outlet } from "@tanstack/react-router"

// Layout cho /luyen-tap/ky-nang/viet/*. Index = list đề, $exerciseId = session.
export const Route = createFileRoute("/_app/luyen-tap/ky-nang/viet")({
	component: VietLayout,
})

function VietLayout() {
	return <Outlet />
}
