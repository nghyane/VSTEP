import type { SkillKey, SkillScores } from "#/features/exam/types"
import { cn } from "#/lib/utils"

const SKILL_LABEL: Record<SkillKey, string> = {
	listening: "Nghe",
	reading: "Đọc",
	writing: "Viết",
	speaking: "Nói",
}

const SKILL_COLOR: Record<SkillKey, string> = {
	listening: "var(--color-skill-listening)",
	reading: "var(--color-skill-reading)",
	writing: "var(--color-skill-writing)",
	speaking: "var(--color-skill-speaking)",
}

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"]

interface Props {
	scores: SkillScores
	activeSkills: SkillKey[]
	compact?: boolean
}

export function SkillScoreCards({ scores, activeSkills, compact }: Props) {
	return (
		<div className={cn("flex flex-wrap justify-center gap-3", compact ? "gap-2" : "gap-4")}>
			{SKILL_ORDER.filter((s) => activeSkills.includes(s)).map((skill) => (
				<SkillCard key={skill} skill={skill} score={scores[skill]} compact={compact} />
			))}
		</div>
	)
}

function SkillCard({ skill, score, compact }: { skill: SkillKey; score: number | null; compact?: boolean }) {
	const color = SKILL_COLOR[skill]
	const pending = score === null

	return (
		<div
			className={cn(
				"flex flex-col items-center rounded-(--radius-card) border-2 border-b-4 bg-card",
				compact ? "px-4 py-2.5 min-w-[72px]" : "px-5 py-4 min-w-[100px]",
				pending ? "border-white/20" : "",
			)}
			style={pending ? undefined : { borderColor: `${color}30` }}
		>
			{pending ? (
				<>
					<span className={cn("font-extrabold tabular-nums text-subtle", compact ? "text-lg" : "text-2xl")}>
						⏳
					</span>
					<span className={cn("text-muted", compact ? "text-[10px]" : "text-xs")}>đang chấm</span>
				</>
			) : (
				<>
					<span
						className={cn("font-extrabold tabular-nums", compact ? "text-lg" : "text-2xl")}
						style={{ color }}
					>
						{score.toFixed(1)}
					</span>
					<span
						className={cn(
							"text-subtle font-bold uppercase tracking-wide",
							compact ? "text-[10px]" : "text-[11px]",
						)}
					>
						{SKILL_LABEL[skill]}
					</span>
				</>
			)}
		</div>
	)
}
