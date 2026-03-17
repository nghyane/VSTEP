import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_learner/vocabulary/$topicId")({
	component: () => <Outlet />,
})
