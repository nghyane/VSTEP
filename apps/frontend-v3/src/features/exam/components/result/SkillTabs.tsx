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
		<nav className="shrink-0 rounded-2xl border border-border bg-card p-3 shadow-sm">
			<div className="flex items-center justify-between gap-3 px-1">
				<div>
					<p className="text-xs font-black uppercase tracking-[0.16em] text-muted">Kỹ năng</p>
					<p className="mt-1 text-sm font-bold text-foreground">Chọn phần cần xem chi tiết</p>
				</div>
				<span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-black text-muted">
					{skills.length}
				</span>
			</div>

			<div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
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
				"flex min-h-[4.5rem] w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all",
				active
					? "border-primary bg-primary-tint/75 text-foreground shadow-sm"
					: "border-border bg-background text-muted hover:border-primary/45 hover:text-foreground",
			)}
		>
			<span
				className="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-surface"
				style={{ borderColor: color, color }}
			>
				<Icon name={meta?.icon ?? "book"} size="xs" />
			</span>
			<span className="min-w-0 flex-1">
				<span className="block truncate text-sm font-extrabold leading-tight">{skill.label}</span>
				<span className="mt-0.5 block truncate text-[11px] font-bold leading-tight text-subtle">
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
