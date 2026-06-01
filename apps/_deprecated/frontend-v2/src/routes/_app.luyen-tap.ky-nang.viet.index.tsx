import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/viet/")({
	beforeLoad: () => {
		throw redirect({ to: "/luyen-tap/ky-nang", search: { skill: "viet", category: "", page: 1 } })
	},
})
