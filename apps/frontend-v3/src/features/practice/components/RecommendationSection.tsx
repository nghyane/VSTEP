import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { SkillChip } from "#/components/SkillChip"
import { learningPathQuery } from "#/features/practice/queries"
import { skills } from "#/lib/skills"

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

function statusColor(skill: string, band: number | null): string {
	if (band === null) return "bg-border"
	if (skill === "vocabulary" || skill === "grammar") return "bg-info"
	if (band >= 8.5) return "bg-success"
	if (band >= 5.0) return "bg-warning"
	return "bg-destructive"
}

export function RecommendationSection() {
	const { data } = useQuery(learningPathQuery)
	if (!data) return null

	const { current_level, target_level, days_remaining, skills: pathSkills } = data.data

	const weak = pathSkills.filter((s) => {
		if (s.band !== null && s.band < 5.0) return true
		if (s.coverage_pct !== null && s.coverage_pct < 50) return true
		return false
	})

	if (weak.length === 0 && pathSkills.length > 0) return null

	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground mb-1">Gợi ý luyện tập</h3>
			<p className="text-sm text-subtle mb-5">
				Dựa trên kết quả thi thử — {current_level} → {target_level}
				{days_remaining !== null && ` · còn ${days_remaining} ngày`}
			</p>

			<div className="card p-5 space-y-0 divide-y divide-border">
				{weak.map((s) => {
					const isExam = skills.some((sk) => sk.key === s.skill)
					const bandText = s.band !== null ? s.band.toFixed(1) : null
					const route = SKILL_ROUTES[s.skill] ?? "/luyen-tap"

					return (
						<div key={s.skill} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
							<span className={`w-2 h-2 shrink-0 rounded-full ${statusColor(s.skill, s.band)}`} />

							{isExam ? (
								<SkillChip skill={s.skill as "listening" | "reading" | "writing" | "speaking"} size="md" />
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

							<Link to={route} className="btn btn-secondary shrink-0">
								{isExam ? "Luyện" : "Vào học"}
							</Link>
						</div>
					)
				})}
			</div>
		</section>
	)
}
