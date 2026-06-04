import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { FoundationSection } from "#/features/practice/components/FoundationSection"
import { SkillsSection } from "#/features/practice/components/SkillsSection"
import { learningPathQuery } from "#/features/practice/queries"
import { getTargetBand } from "#/lib/vstep"

const EXAM_SKILL_LABELS: Record<string, string> = {
	listening: "Listening",
	reading: "Reading",
	writing: "Writing",
	speaking: "Speaking",
}

export const Route = createFileRoute("/_app/luyen-tap/")({
	component: PracticePage,
})

function PracticePage() {
	return (
		<>
			<Header title="Luyện tập" />
			<div className="px-10 pb-12 space-y-10">
				<PracticeGoalSummary />
				<FoundationSection />
				<SkillsSection />
			</div>
		</>
	)
}

function PracticeGoalSummary() {
	const { data } = useQuery(learningPathQuery)
	if (!data) return null

	const { current_level, target_level, days_remaining, skills } = data.data
	const requiredBand = getTargetBand(target_level)
	const scoredSkills = skills
		.filter((skill) => skill.band !== null && skill.skill in EXAM_SKILL_LABELS)
		.sort((a, b) => (a.band ?? 0) - (b.band ?? 0))
	const prioritySkill = scoredSkills.find((skill) => (skill.band ?? 0) < requiredBand)
	const currentAction =
		scoredSkills.length === 0
			? "Làm thi thử để hệ thống phân tích kỹ năng."
			: prioritySkill
				? `Ưu tiên hiện tại: ${EXAM_SKILL_LABELS[prioritySkill.skill]} ${prioritySkill.band?.toFixed(1)}, cần ≥ ${requiredBand.toFixed(1)}`
				: "Các kỹ năng đã đạt mục tiêu. Tiếp tục duy trì."

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap items-center gap-2">
				<span className="rounded-full border-2 border-border bg-surface px-3 py-1.5 text-sm font-extrabold text-foreground">
					Mục tiêu: {target_level} ≥ {requiredBand.toFixed(1)} điểm
				</span>
				<span className="rounded-full bg-surface px-3 py-1.5 text-sm font-bold text-subtle">
					Hiện tại: {current_level}
				</span>
				{days_remaining !== null && (
					<span className="rounded-full bg-surface px-3 py-1.5 text-sm font-bold text-subtle">
						Còn {days_remaining} ngày
					</span>
				)}
			</div>
			<div className="inline-flex rounded-2xl border-2 border-border bg-surface px-3 py-2 text-sm font-bold text-foreground">
				{currentAction}
			</div>
		</div>
	)
}
