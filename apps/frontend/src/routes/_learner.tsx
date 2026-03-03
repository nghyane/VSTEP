import { createFileRoute } from "@tanstack/react-router"
import { LearnerLayout } from "@/components/layouts/LearnerLayout"

export const Route = createFileRoute("/_learner")({
	component: LearnerLayout,
})
