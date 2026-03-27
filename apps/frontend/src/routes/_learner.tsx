import { createFileRoute, redirect } from "@tanstack/react-router"
import { LearnerLayout } from "@/components/layouts/LearnerLayout"
import { isAuthenticated, token } from "@/lib/auth"

const ONBOARDING_KEY = "vstep_onboarding_done"

export const Route = createFileRoute("/_learner")({
	beforeLoad: async () => {
		if (!isAuthenticated()) throw redirect({ to: "/login" })

		if (localStorage.getItem(ONBOARDING_KEY) === "1") return

		try {
			const res = await fetch(
				`${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/api/v1/onboarding/status`,
				{ headers: { Authorization: `Bearer ${token()}` } },
			)
			if (res.ok) {
				const data = await res.json()
				if (data.completed) {
					localStorage.setItem(ONBOARDING_KEY, "1")
					return
				}
				throw redirect({ to: "/onboarding" })
			}
			// API error (401, 500, etc.) — skip onboarding check to avoid redirect loop
			return
		} catch (e) {
			if (e && typeof e === "object" && "to" in e) throw e
			// Network/fetch error — skip onboarding check
			return
		}
	},
	component: LearnerLayout,
})
