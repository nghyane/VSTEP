import { createFileRoute, redirect } from "@tanstack/react-router"
import { FocusedLayout } from "@/components/layouts/FocusedLayout"
import { isAuthenticated } from "@/lib/auth"

export const Route = createFileRoute("/_focused")({
	beforeLoad: () => {
		if (!isAuthenticated()) throw redirect({ to: "/login" })
	},
	component: FocusedLayout,
})
