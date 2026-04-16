import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/noi/")({
	beforeLoad: () => {
		throw redirect({ to: "/luyen-tap/ky-nang", search: { skill: "noi", category: "", page: 1 } })
	},
})
