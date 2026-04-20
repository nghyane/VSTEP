import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { FoundationSection } from "#/features/practice/components/FoundationSection"
import { SkillsSection } from "#/features/practice/components/SkillsSection"

export const Route = createFileRoute("/_app/luyen-tap/")({
	component: PracticePage,
})

function PracticePage() {
	return (
		<>
			<Header title="Luyện tập" />
			<div className="px-10 pb-12 space-y-10">
				<FoundationSection />
				<SkillsSection />
			</div>
		</>
	)
}
