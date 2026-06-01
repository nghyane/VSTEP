import { createFileRoute, Outlet } from "@tanstack/react-router"

// Layout route cho /luyen-tap/nen-tang/ngu-phap/*. Content ở
// _app.luyen-tap.nen-tang.ngu-phap.index.tsx, detail $pointId render qua <Outlet/>.
export const Route = createFileRoute("/_app/luyen-tap/nen-tang/ngu-phap")({
	component: NguPhapLayout,
})

function NguPhapLayout() {
	return <Outlet />
}
