import { createFileRoute, Outlet } from "@tanstack/react-router"

// Layout cho /luyen-tap/ky-nang/noi/*.
export const Route = createFileRoute("/_app/luyen-tap/ky-nang/noi")({
	component: NoiLayout,
})

function NoiLayout() {
	return <Outlet />
}
