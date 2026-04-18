// WritingConfigBar — header config: chọn target level + toggle mode.

import { PencilLine, Sparkles } from "lucide-react"
import { Label } from "#/components/ui/label"
import { Switch } from "#/components/ui/switch"
import type { TargetLevel } from "#/lib/practice/writing-structures"
import { cn } from "#/lib/utils"

interface Props {
	targetLevel: TargetLevel
	onTargetLevelChange: (level: TargetLevel) => void
	smartMode: boolean
	onSmartModeChange: (enabled: boolean) => void
}

const LEVELS: readonly TargetLevel[] = ["B1", "B2", "C1"]

export function WritingConfigBar({
	targetLevel,
	onTargetLevelChange,
	smartMode,
	onSmartModeChange,
}: Props) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-muted/50 p-4 shadow-sm">
			{/* Target level picker */}
			<div className="flex items-center gap-3">
				<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Mục tiêu
				</span>
				<div className="inline-flex items-center gap-1 rounded-lg border bg-background p-1">
					{LEVELS.map((lv) => {
						const active = lv === targetLevel
						return (
							<button
								key={lv}
								type="button"
								onClick={() => onTargetLevelChange(lv)}
								className={cn(
									"rounded-md px-3 py-1 text-sm font-semibold transition-colors",
									active
										? "bg-primary text-primary-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{lv}
							</button>
						)
					})}
				</div>
			</div>

			{/* Mode toggle */}
			<div className="flex items-center gap-3">
				{smartMode ? (
					<Sparkles className="size-4 text-primary" />
				) : (
					<PencilLine className="size-4 text-muted-foreground" />
				)}
				<Label htmlFor="writing-smart-mode" className="cursor-pointer text-sm font-medium select-none">
					{smartMode ? "Hỗ trợ thông minh" : "Tự do"}
				</Label>
				<Switch
					id="writing-smart-mode"
					checked={smartMode}
					onCheckedChange={onSmartModeChange}
					aria-label="Bật/tắt chế độ hỗ trợ thông minh"
				/>
			</div>
		</div>
	)
}
