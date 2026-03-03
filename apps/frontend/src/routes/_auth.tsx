import { createFileRoute } from "@tanstack/react-router"
import { AuthLayout } from "@/components/layouts/AuthLayout"

export const Route = createFileRoute("/_auth")({
	component: AuthLayout,
})
