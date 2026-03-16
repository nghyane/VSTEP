import { createFileRoute, redirect } from "@tanstack/react-router"
import { LearnerLayout } from "@/components/layouts/LearnerLayout"
import { isAuthenticated, token } from "@/lib/auth"

const ONBOARDING_KEY = "vstep_onboarding_done"

export const Route = createFileRoute("/_learner")({
	beforeLoad: async () => {
		if (!isAuthenticated()) throw redirect({ to: "/login" })

		// Skip check if already marked as done
		if (localStorage.getItem(ONBOARDING_KEY) === "1") return

		try {
			const res = await fetch(
				`${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/onboarding/status`,
				{ headers: { Authorization: `Bearer ${token()}` } },
			)
			if (res.ok) {
				const data = await res.json()
				if (data.completed) {
					localStorage.setItem(ONBOARDING_KEY, "1")
				} else {
					throw redirect({ to: "/onboarding" })
				}
			}
		} catch (e) {
			if (e && typeof e === "object" && "to" in e) throw e
			// Network error — don't block, let user through
		}
	},
	component: LearnerLayout,
})
