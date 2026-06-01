import { createFileRoute, Outlet } from "@tanstack/react-router"

// Layout route cho nhánh /luyen-tap/nen-tang/*. Hub content ở
// _app.luyen-tap.nen-tang.index.tsx (match /luyen-tap/nen-tang), con như
// /tu-vung render qua <Outlet />.
export const Route = createFileRoute("/_app/luyen-tap/nen-tang")({
	component: NenTangLayout,
})

function NenTangLayout() {
	return <Outlet />
}
