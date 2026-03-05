import { createFileRoute } from "@tanstack/react-router"
import { SkillPracticePage } from "./-components/SkillPracticePage"

export const Route = createFileRoute("/_learner/practice/reading")({
	component: () => <SkillPracticePage skill="reading" />,
})
