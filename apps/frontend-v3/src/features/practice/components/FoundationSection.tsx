import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { SkillIcon } from "#/components/SkillIcon"
import { learningPathQuery } from "#/features/practice/queries"
import type { LearningPathSkill } from "#/features/practice/types"

function progressText(skill: LearningPathSkill | undefined, fallbackTotal: number, unit: string): string {
	const completed = skill?.completed_items ?? 0
	const total = skill?.total_items ?? fallbackTotal
	return `${completed}/${total} ${unit}`
}

export function FoundationSection() {
	const { data } = useQuery(learningPathQuery)
	const hasPathData = data !== undefined
	const pathSkills = data?.data.skills ?? []
	const vocabulary = pathSkills.find((skill) => skill.skill === "vocabulary")
	const grammar = pathSkills.find((skill) => skill.skill === "grammar")

	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground mb-1">Nền tảng</h3>
			<p className="text-sm text-subtle mb-3">Từ vựng và ngữ pháp — gốc rễ mọi kỹ năng</p>

			{hasPathData && (
				<div className="mb-5 flex flex-wrap gap-2">
					<span className="self-center text-xs font-extrabold uppercase tracking-wider text-muted">
						Gợi ý
					</span>
					<ProgressPill
						title="Từ vựng"
						text={progressText(vocabulary, 120, `từ ${vocabulary?.level ?? "B1"}`)}
					/>
					<ProgressPill title="Ngữ pháp" text={progressText(grammar, 10, "chủ điểm")} />
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Link to="/luyen-tap/tu-vung" className="card-interactive p-5">
					<div className="flex items-start gap-4">
						<SkillIcon name="vocabulary" size="md" className="shrink-0" />
						<div className="flex-1 min-w-0">
							<h4 className="font-bold text-lg text-foreground">Từ vựng</h4>
							<p className="text-sm text-subtle mt-0.5">Flashcard SRS theo chủ đề và level</p>
						</div>
					</div>
				</Link>

				<Link to="/luyen-tap/ngu-phap" className="card-interactive p-5">
					<div className="flex items-start gap-4">
						<SkillIcon name="grammar" size="md" className="shrink-0" />
						<div className="flex-1 min-w-0">
							<h4 className="font-bold text-lg text-foreground">Ngữ pháp</h4>
							<p className="text-sm text-subtle mt-0.5">Điểm ngữ pháp theo cấp độ và kỹ năng</p>
						</div>
					</div>
				</Link>
			</div>
		</section>
	)
}

function ProgressPill({ title, text }: { title: string; text: string }) {
	return (
		<span className="rounded-full border-2 border-border bg-surface px-3 py-1.5 text-xs font-bold text-subtle tabular-nums">
			<span className="font-extrabold text-foreground">{title}</span> · {text}
		</span>
	)
}
