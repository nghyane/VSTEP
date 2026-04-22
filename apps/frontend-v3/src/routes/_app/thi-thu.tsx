import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/thi-thu")({
	component: () => <Outlet />,
})
