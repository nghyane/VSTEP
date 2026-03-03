import { createFileRoute, redirect } from "@tanstack/react-router"
import { LearnerLayout } from "@/components/layouts/LearnerLayout"
import { isAuthenticated } from "@/lib/auth"

export const Route = createFileRoute("/_learner")({
	beforeLoad: () => {
		if (!isAuthenticated()) throw redirect({ to: "/login" })
	},
	component: LearnerLayout,
})
