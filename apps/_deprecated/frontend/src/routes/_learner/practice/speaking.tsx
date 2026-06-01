import { createFileRoute } from "@tanstack/react-router"
import { SkillPracticePage } from "./-components/SkillPracticePage"

export const Route = createFileRoute("/_learner/practice/speaking")({
	component: () => <SkillPracticePage skill="speaking" />,
})
