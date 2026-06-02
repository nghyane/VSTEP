import { cn } from "#/lib/utils"
import { ENTRY_LEVELS, parseVstepLevel, type VstepLevel } from "#/lib/vstep"

export const LEVELS = ENTRY_LEVELS
export type Level = VstepLevel

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
	availableLevels?: readonly Level[]
	allowClear?: boolean
}

export function toLevel(value: string): Level | null {
	return parseVstepLevel(value)
}

export function LevelFilters({ level, onLevelChange, availableLevels = LEVELS, allowClear = true }: Props) {
	return (
		<div className="flex items-center gap-1.5">
			{availableLevels.map((lv) => {
				const active = level === lv
				return (
					<button
						key={lv}
						type="button"
						onClick={() => onLevelChange(active && allowClear ? null : lv)}
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
