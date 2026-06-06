import type { ResultViewModel } from "#/features/exam/components/result/view-model"
import type { SkillKey } from "#/features/exam/types"
import { cn } from "#/lib/utils"

interface Props {
	readonly skills: ResultViewModel["skills"]
	readonly activeSkill: SkillKey
	readonly onSelect: (skill: SkillKey) => void
}

export function ResultSkillTabs({ skills, activeSkill, onSelect }: Props) {
	return (
		<nav className="shrink-0 border-b-2 border-border-light bg-surface p-3">
			<div
				className="grid gap-1 rounded-(--radius-card) bg-background p-1 sm:gap-2"
				style={{ gridTemplateColumns: `repeat(${Math.max(skills.length, 1)}, minmax(0, 1fr))` }}
			>
				{skills.map((skill) => (
					<button
						key={skill.key}
						type="button"
						onClick={() => onSelect(skill.key)}
						className={cn(
							"rounded-(--radius-button) px-3 py-2.5 text-center text-sm font-black transition-colors",
							activeSkill === skill.key
								? "bg-surface text-primary-dark shadow-sm"
								: "text-subtle hover:bg-surface/70 hover:text-foreground",
						)}
					>
						{skill.label}
					</button>
				))}
			</div>
		</nav>
	)
}
