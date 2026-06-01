import { createFileRoute, Outlet } from "@tanstack/react-router"

// Layout route cho nhánh /luyen-tap/*. Nội dung trang "Chọn chế độ"
// nằm ở _app.luyen-tap.index.tsx (match /luyen-tap chính xác),
// các trang con như /nen-tang, /nen-tang/tu-vung render qua <Outlet />.
export const Route = createFileRoute("/_app/luyen-tap")({
	component: LuyenTapLayout,
})

function LuyenTapLayout() {
	return <Outlet />
}
