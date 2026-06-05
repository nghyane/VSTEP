import { Icon } from "#/components/Icon"
import { reviewSkills, scoreLabel } from "#/features/exam/components/result/helpers"
import type { SessionResultsData, SkillKey } from "#/features/exam/types"
import { skills as skillRegistry } from "#/lib/skills"
import { cn } from "#/lib/utils"

interface Props {
	readonly result: SessionResultsData
	readonly activeSkill: SkillKey
	readonly onSelect: (skill: SkillKey) => void
}

export function SkillTabs({ result, activeSkill, onSelect }: Props) {
	const skills = reviewSkills(result)

	return (
		<nav className="mt-3 shrink-0">
			<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
				{skills.map((skill) => (
					<SkillChip
						key={skill.key}
						skill={skill}
						score={result.session.scores?.[skill.key] ?? null}
						active={activeSkill === skill.key}
						onSelect={onSelect}
					/>
				))}
			</div>
		</nav>
	)
}

function SkillChip({
	skill,
	score,
	active,
	onSelect,
}: {
	readonly skill: SessionResultsData["review"]["skills"][number]
	readonly score: number | null
	readonly active: boolean
	readonly onSelect: (skill: SkillKey) => void
}) {
	const meta = skillRegistry.find((item) => item.key === skill.key)
	const color = meta?.color ?? "var(--color-primary)"
	const hasScore = score !== null && score !== undefined

	return (
		<button
			type="button"
			onClick={() => onSelect(skill.key)}
			className={cn(
				"inline-flex min-w-[9.5rem] items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all",
				active
					? "border-primary bg-primary-tint text-foreground shadow-sm"
					: "border-border bg-surface text-muted hover:text-foreground",
			)}
		>
			<span
				className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background"
				style={{ borderColor: color, color }}
			>
				<Icon name={meta?.icon ?? "book"} size="xs" />
			</span>
			<span className="min-w-0">
				<span className="block truncate text-sm font-extrabold leading-tight">{skill.label}</span>
				<span className="text-[11px] font-bold leading-tight text-subtle">
					{hasScore ? scoreLabel(score) : skill.status_label}
				</span>
			</span>
			{skill.issue_count > 0 && (
				<span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-black text-white">
					{skill.issue_count}
				</span>
			)}
		</button>
	)
}
