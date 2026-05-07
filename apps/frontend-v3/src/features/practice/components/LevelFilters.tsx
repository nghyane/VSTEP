import { cn } from "#/lib/utils"

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const
export type Level = (typeof LEVELS)[number]

export const LEVEL_COLORS: Record<Level, { active: string; text: string }> = {
	A1: { active: "bg-success/15 border-success/40", text: "text-success" },
	A2: { active: "bg-info/15 border-info/40", text: "text-info" },
	B1: { active: "bg-warning/15 border-warning/40", text: "text-warning" },
	B2: { active: "bg-skill-speaking/15 border-skill-speaking/40", text: "text-skill-speaking" },
	C1: { active: "bg-destructive/15 border-destructive/40", text: "text-destructive" },
}

interface Props {
	level: Level | null
	onLevelChange: (v: Level | null) => void
}

export function LevelFilters({ level, onLevelChange }: Props) {
	return (
		<div className="flex items-center gap-1.5">
			{LEVELS.map((lv) => {
				const active = level === lv
				return (
					<button
						key={lv}
						type="button"
						onClick={() => onLevelChange(active ? null : lv)}
						className={cn(
							"px-3 py-1.5 rounded-(--radius-button) text-xs font-bold border-2 transition-colors cursor-pointer",
							active
								? cn(LEVEL_COLORS[lv].active, LEVEL_COLORS[lv].text)
								: "bg-surface text-muted border-border hover:border-border-focus hover:text-foreground",
						)}
					>
						{lv}
					</button>
				)
			})}
		</div>
	)
}
