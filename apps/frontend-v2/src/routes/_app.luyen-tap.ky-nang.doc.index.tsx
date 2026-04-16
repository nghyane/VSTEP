import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/doc/")({
	beforeLoad: () => {
		throw redirect({ to: "/luyen-tap/ky-nang", search: { skill: "doc", category: "", page: 1 } })
	},
})
