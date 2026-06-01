import { createFileRoute, Outlet } from "@tanstack/react-router"

// Layout cho /luyen-tap/ky-nang/doc/*. Index = list đề, $exerciseId = session.
export const Route = createFileRoute("/_app/luyen-tap/ky-nang/doc")({
	component: DocLayout,
})

function DocLayout() {
	return <Outlet />
}
