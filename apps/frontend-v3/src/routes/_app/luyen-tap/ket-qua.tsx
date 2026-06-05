import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/luyen-tap/ket-qua")({
	beforeLoad: () => {
		throw redirect({ to: "/luyen-tap/viet", hash: "history" })
	},
})
