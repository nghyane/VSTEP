import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/luyen-tap/ngu-phap")({
	component: () => <Outlet />,
})
