import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/khoa-hoc")({
	component: () => <Outlet />,
})
