import { createFileRoute, Outlet } from "@tanstack/react-router"

// Layout route cho /luyen-tap/nen-tang/tu-vung/*. List content ở
// _app.luyen-tap.nen-tang.tu-vung.index.tsx, study screen $topicId render
// qua <Outlet />.
export const Route = createFileRoute("/_app/luyen-tap/nen-tang/tu-vung")({
	component: TuVungLayout,
})

function TuVungLayout() {
	return <Outlet />
}
