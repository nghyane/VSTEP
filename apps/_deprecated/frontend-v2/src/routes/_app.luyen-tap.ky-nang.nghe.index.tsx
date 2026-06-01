import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/nghe/")({
	beforeLoad: () => {
		throw redirect({ to: "/luyen-tap/ky-nang", search: { skill: "nghe", category: "", page: 1 } })
	},
})
