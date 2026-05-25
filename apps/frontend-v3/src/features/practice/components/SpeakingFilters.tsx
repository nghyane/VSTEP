import { SegmentedTabs } from "#/components/SegmentedTabs"
import { type Level, LevelFilters } from "#/features/practice/components/LevelFilters"

export type { Level }

export type StatusFilter = "Tất cả" | "Chưa làm" | "Đang làm" | "Hoàn thành"

const STATUS_FILTER_ITEMS: { value: StatusFilter; label: string }[] = [
	{ value: "Tất cả", label: "Tất cả" },
	{ value: "Chưa làm", label: "Chưa làm" },
	{ value: "Đang làm", label: "Đang làm" },
	{ value: "Hoàn thành", label: "Hoàn thành" },
]

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

			<SegmentedTabs items={STATUS_FILTER_ITEMS} value={status} onChange={onStatusChange} />
		</div>
	)
}
