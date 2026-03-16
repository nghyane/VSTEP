import { createFileRoute, redirect } from "@tanstack/react-router"
import { InstructorLayout } from "@/components/layouts/InstructorLayout"
import { isAuthenticated, user } from "@/lib/auth"

export const Route = createFileRoute("/_instructor")({
	beforeLoad: () => {
		if (!isAuthenticated()) throw redirect({ to: "/login" })
		const u = user()
		if (u && u.role !== "instructor" && u.role !== "admin") {
			throw redirect({ to: "/" })
		}
	},
	component: InstructorLayout,
})
