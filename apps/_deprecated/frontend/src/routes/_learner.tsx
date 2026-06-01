import { createFileRoute, redirect } from "@tanstack/react-router"
import { LearnerLayout } from "@/components/layouts/LearnerLayout"
import { api } from "@/lib/api"
import { isAuthenticated } from "@/lib/auth"
import { queryClient } from "@/lib/query-client"

interface OnboardingStatus {
	completed: boolean
}

export const onboardingStatusQueryKey = ["onboarding-status"] as const

export const Route = createFileRoute("/_learner")({
	beforeLoad: async () => {
		if (!isAuthenticated()) throw redirect({ to: "/login" })

		try {
			const status = await queryClient.fetchQuery({
				queryKey: onboardingStatusQueryKey,
				queryFn: () => api.get<OnboardingStatus>("/api/onboarding/status"),
				staleTime: 1000 * 60 * 5,
			})

			if (!status.completed) {
				throw redirect({ to: "/onboarding" })
			}
		} catch (e) {
			// Re-throw redirects
			if (e && typeof e === "object" && "to" in e) throw e
			// API/network error — fail-open to avoid blocking learner area
		}
	},
	component: LearnerLayout,
})
