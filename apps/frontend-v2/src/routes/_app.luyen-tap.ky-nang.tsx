import { createFileRoute, Outlet } from "@tanstack/react-router"

// Layout route cho /luyen-tap/ky-nang/*. Content ở index + các route con theo skill.
export const Route = createFileRoute("/_app/luyen-tap/ky-nang")({
	component: KyNangLayout,
})

function KyNangLayout() {
	return <Outlet />
}
