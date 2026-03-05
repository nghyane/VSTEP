import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_learner/dashboard")({
	beforeLoad: () => {
		throw redirect({ to: "/practice" })
	},
})
