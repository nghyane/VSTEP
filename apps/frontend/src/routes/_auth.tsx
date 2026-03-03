import { createFileRoute, redirect } from "@tanstack/react-router"
import { AuthLayout } from "@/components/layouts/AuthLayout"
import { isAuthenticated } from "@/lib/auth"

export const Route = createFileRoute("/_auth")({
	beforeLoad: () => {
		if (isAuthenticated()) throw redirect({ to: "/dashboard" })
	},
	component: AuthLayout,
})
