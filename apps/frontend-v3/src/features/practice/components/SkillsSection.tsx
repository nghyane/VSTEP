import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { SkillIcon } from "#/components/SkillIcon"
import { learningPathQuery } from "#/features/practice/queries"
import type { LearningPathSkill } from "#/features/practice/types"
import type { SkillKey } from "#/lib/skills"
import { skills } from "#/lib/skills"

function targetBand(targetLevel: string): number {
	if (targetLevel === "C1") return 8.5
	if (targetLevel === "B2") return 6.0
	return 4.0
}

function isLowerBand(a: LearningPathSkill, b: LearningPathSkill): number {
	return (a.band ?? 0) - (b.band ?? 0)
}

function priorityLabel(skill: LearningPathSkill, targetLevel: string, index: number): string {
	const band = skill.band ?? 0
	const requiredBand = targetBand(targetLevel)
	if (band >= requiredBand) return "Duy trì"
	if (index === 0) return "Ưu tiên"
	return "Cải thiện"
}

export function SkillsSection() {
	const { data } = useQuery(learningPathQuery)
	const hasPathData = data !== undefined
	const targetLevel = data?.data.target_level ?? "B1"
	const scoredSkills = (data?.data.skills ?? [])
		.filter(
			(skill): skill is LearningPathSkill & { skill: SkillKey } =>
				skills.some((item) => item.key === skill.skill) && skill.band !== null,
		)
		.sort(isLowerBand)

	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground mb-1">Kỹ năng</h3>
			<div className="mb-3 flex flex-wrap items-center gap-2">
				<p className="text-sm text-subtle">Luyện 4 kỹ năng VSTEP theo mục tiêu hiện tại</p>
				{hasPathData && scoredSkills.length === 0 && (
					<span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold text-subtle">
						Làm thi thử để có điểm phân tích kỹ năng
					</span>
				)}
			</div>
			{scoredSkills.length > 0 && (
				<div className="mb-5 flex flex-wrap gap-2">
					<span className="self-center text-xs font-extrabold uppercase tracking-wider text-muted">
						Gợi ý
					</span>
					{scoredSkills.map((skill, index) => (
						<ScorePill key={skill.skill} index={index} skill={skill} targetLevel={targetLevel} />
					))}
				</div>
			)}

			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{skills.map((s) => (
					<Link key={s.key} to={s.route} className="card-interactive p-5">
						<SkillIcon name={s.pngIcon} size="md" className="mb-3" />
						<h4 className="font-bold text-base text-foreground">{s.label}</h4>
						<p className="text-xs text-subtle mt-0.5">{s.en}</p>
						<p className="text-sm text-muted mt-2">{s.desc}</p>
					</Link>
				))}
			</div>
		</section>
	)
}

function dotColor(skill: LearningPathSkill, targetLevel: string, index: number): string {
	const band = skill.band ?? 0
	const requiredBand = targetBand(targetLevel)
	if (band >= requiredBand) return "bg-info"
	if (index === 0) return "bg-destructive"
	return "bg-warning"
}

function ScorePill({
	index,
	skill,
	targetLevel,
}: {
	index: number
	skill: LearningPathSkill & { skill: SkillKey }
	targetLevel: string
}) {
	return (
		<span className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-surface px-3 py-1.5 text-xs font-bold text-subtle tabular-nums">
			<span className={`size-2 shrink-0 rounded-full ${dotColor(skill, targetLevel, index)}`} />
			<span className="font-extrabold text-foreground">
				{skills.find((item) => item.key === skill.skill)?.en}
			</span>
			{skill.band?.toFixed(1)}/{targetBand(targetLevel).toFixed(1)} ·{" "}
			{priorityLabel(skill, targetLevel, index)}
		</span>
	)
}
