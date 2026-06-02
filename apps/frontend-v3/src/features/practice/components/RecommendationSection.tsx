import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { SkillChip } from "#/components/SkillChip"
import type { SkillKey } from "#/features/exam/types"
import { grammarPointsQuery } from "#/features/grammar/queries"
import { learningPathQuery } from "#/features/practice/queries"
import type { LearningPathSkill } from "#/features/practice/types"

const SKILL_ROUTES: Record<string, string> = {
	listening: "/luyen-tap/nghe",
	reading: "/luyen-tap/doc",
	writing: "/luyen-tap/viet",
	speaking: "/luyen-tap/noi",
	vocabulary: "/luyen-tap/tu-vung",
	grammar: "/luyen-tap/ngu-phap",
}

const SKILL_LABELS: Record<string, string> = {
	listening: "Nghe",
	reading: "Đọc",
	writing: "Viết",
	speaking: "Nói",
	vocabulary: "Từ vựng",
	grammar: "Ngữ pháp",
}

const EXAM_SKILLS: Record<SkillKey, true> = {
	listening: true,
	reading: true,
	writing: true,
	speaking: true,
}

function isExamSkill(skill: string): skill is SkillKey {
	return skill in EXAM_SKILLS
}

function statusColor(skill: string, band: number | null): string {
	if (band === null) return "bg-border"
	if (skill === "vocabulary" || skill === "grammar") return "bg-info"
	if (band >= 8.5) return "bg-success"
	if (band >= 5.0) return "bg-warning"
	return "bg-destructive"
}

function isActionableRecommendation(skill: LearningPathSkill): boolean {
	if (skill.coverage_pct !== null) return skill.coverage_pct < 100
	if (skill.band === null) return true
	return skill.band < 5.0
}

export function RecommendationSection() {
	const { data } = useQuery(learningPathQuery)
	const { data: grammarData } = useQuery(grammarPointsQuery)
	if (!data) return null

	const { current_level, target_level, days_remaining, skills: pathSkills } = data.data

	const recommendations = pathSkills.filter(isActionableRecommendation)

	if (pathSkills.length === 0) return null

	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground mb-1">Gợi ý luyện tập</h3>
			<p className="text-sm text-subtle mb-5">
				Dựa trên kết quả thi thử — {current_level} → {target_level}
				{days_remaining !== null && ` · còn ${days_remaining} ngày`}
			</p>

			<div className="card p-5 space-y-0 divide-y divide-border">
				{recommendations.length === 0 && (
					<div className="py-3">
						<p className="font-bold text-sm text-foreground">Bạn đã hoàn thành mục tiêu hiện tại.</p>
						<p className="text-sm text-subtle mt-1">
							Tiếp tục làm đề hoặc luyện lại các phần đã học để giữ nhịp trước khi lên mục tiêu mới.
						</p>
					</div>
				)}
				{recommendations.map((s) => {
					const isExam = isExamSkill(s.skill)
					const bandText = s.band !== null ? s.band.toFixed(1) : null
					const grammarPoint =
						s.skill === "grammar"
							? (grammarData?.data.find(
									(point) =>
										point.levels.includes(s.level) &&
										(point.mastery === null || point.mastery.attempts === 0),
								) ??
								grammarData?.data.find((point) => point.levels.includes(s.level)) ??
								null)
							: null

					return (
						<div key={s.skill} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
							<span className={`w-2 h-2 shrink-0 rounded-full ${statusColor(s.skill, s.band)}`} />

							{isExam ? (
								<SkillChip skill={s.skill} size="md" />
							) : (
								<span className="inline-flex items-center rounded-full border-2 border-border bg-surface px-2.5 py-1 text-xs font-bold text-foreground">
									{SKILL_LABELS[s.skill] ?? s.skill}
								</span>
							)}

							{bandText && <span className="font-bold text-sm text-foreground tabular-nums">{bandText}</span>}

							{s.coverage_pct !== null && (
								<span className="text-sm text-subtle tabular-nums">{s.coverage_pct}%</span>
							)}

							<span className="text-sm text-subtle flex-1 min-w-0 truncate">{s.suggestion}</span>

							<RecommendationLink skill={s} isExam={isExam} grammarPointId={grammarPoint?.id ?? null} />
						</div>
					)
				})}
			</div>
		</section>
	)
}

function RecommendationLink({
	skill,
	isExam,
	grammarPointId,
}: {
	skill: LearningPathSkill
	isExam: boolean
	grammarPointId: string | null
}) {
	if (skill.skill === "grammar" && grammarPointId) {
		return (
			<Link
				to="/luyen-tap/ngu-phap/$pointId"
				params={{ pointId: grammarPointId }}
				className="btn btn-secondary shrink-0"
			>
				Vào học
			</Link>
		)
	}

	const route = SKILL_ROUTES[skill.skill] ?? "/luyen-tap"
	return (
		<Link to={route} className="btn btn-secondary shrink-0">
			{isExam ? "Luyện" : "Vào học"}
		</Link>
	)
}
