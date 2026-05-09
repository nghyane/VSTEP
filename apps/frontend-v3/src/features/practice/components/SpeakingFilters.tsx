import { type Level, LevelFilters } from "#/features/practice/components/LevelFilters"
import { cn } from "#/lib/utils"

export type { Level }

const STATUS_OPTIONS = ["Tất cả", "Chưa làm", "Đang làm", "Hoàn thành"] as const
export type StatusFilter = (typeof STATUS_OPTIONS)[number]

interface Props {
	level: Level | null
	status: StatusFilter
	onLevelChange: (v: Level | null) => void
	onStatusChange: (v: StatusFilter) => void
}

export function SpeakingFilters({ level, status, onLevelChange, onStatusChange }: Props) {
	return (
		<div className="flex items-center gap-3 flex-wrap">
			<LevelFilters level={level} onLevelChange={onLevelChange} />

			<div className="w-px h-6 bg-border" />

			<div className="flex items-center gap-1.5">
				{STATUS_OPTIONS.map((opt) => (
					<button
						key={opt}
						type="button"
						onClick={() => onStatusChange(opt)}
						className={cn(
							"px-3 py-1.5 rounded-(--radius-button) text-xs font-bold border-2 transition-colors cursor-pointer",
							status === opt
								? "bg-primary text-primary-foreground border-primary"
								: "bg-surface text-muted border-border hover:border-border-focus hover:text-foreground",
						)}
					>
						{opt}
					</button>
				))}
			</div>
		</div>
	)
}
