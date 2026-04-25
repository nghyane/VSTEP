import { useQuery } from "@tanstack/react-query"
import { SkillChip } from "#/components/SkillChip"
import { OnboardingRow } from "#/features/dashboard/components/OnboardingRow"
import { examSessionsQuery, overviewQuery } from "#/features/dashboard/queries"
import type { ExamSessionResult } from "#/features/dashboard/types"
import { type Skill, skills } from "#/lib/skills"
import { round } from "#/lib/utils"
import { getTargetBand } from "#/lib/vstep"

interface SkillStat {
	current: number | null
	delta: number | null
}

function computeSkillStats(sessions: ExamSessionResult[]): Record<string, SkillStat> {
	const submitted = sessions.filter((s) => s.submitted_at !== null && s.scores)
	const result: Record<string, SkillStat> = {}
	for (const s of skills) {
		const history = submitted
			.map((sess) => sess.scores?.[s.key])
			.filter((v): v is number => v !== null && v !== undefined)
		const current = history[0] ?? null
		const prev = history[1] ?? null
		result[s.key] = {
			current,
			delta: current !== null && prev !== null ? round(current - prev) : null,
		}
	}
	return result
}

function gapLabel(current: number | null, targetBand: number): { text: string; tone: string } {
	if (current === null) return { text: "Chưa có điểm", tone: "text-placeholder" }
	const gap = round(current - targetBand)
	if (gap >= 0) return { text: "✓ Đạt mục tiêu", tone: "text-success" }
	return { text: `Cần thêm ${Math.abs(gap).toFixed(1)} band`, tone: "text-warning" }
}

function deltaBadge(delta: number | null) {
	if (delta === null || delta === 0) return null
	if (delta > 0) return { text: `▲ +${delta.toFixed(1)} vs bài trước` }
	return { text: `▼ ${Math.abs(delta).toFixed(1)} vs bài trước` }
}

function SkillCard({ skill, stat, targetBand }: { skill: Skill; stat: SkillStat; targetBand: number }) {
	const gap = gapLabel(stat.current, targetBand)
	const badge = deltaBadge(stat.delta)
	return (
		<div className="card p-4 flex flex-col gap-2">
			<div className="flex items-center justify-between gap-2">
				<SkillChip skill={skill.key} size="md" />
				{badge && <span className="text-[11px] font-bold text-subtle">{badge.text}</span>}
			</div>
			<p className="font-extrabold text-2xl text-foreground">
				{stat.current !== null ? stat.current.toFixed(1) : "—"}
				<span className="text-sm text-subtle font-normal"> / 10</span>
			</p>
			<p className={`text-xs font-bold ${gap.tone}`}>{gap.text}</p>
			<p className="text-[11px] text-subtle">Mục tiêu: {targetBand.toFixed(1)}</p>
		</div>
	)
}

export function StatsRow() {
	const { data: overview } = useQuery(overviewQuery)
	const { data: sessions } = useQuery(examSessionsQuery)

	if (!overview) return null

	const { profile, stats } = overview.data
	if (stats.total_tests === 0) return <OnboardingRow />

	const targetBand = getTargetBand(profile.target_level)
	const skillStats = computeSkillStats(sessions ?? [])

	return (
		<section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
			{skills.map((s) => (
				<SkillCard key={s.key} skill={s} stat={skillStats[s.key]} targetBand={targetBand} />
			))}
		</section>
	)
}
