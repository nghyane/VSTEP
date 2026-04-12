// WritingEditor — textarea lớn + picker chế độ hỗ trợ ở toolbar + word counter.
// Panel hỗ trợ ở cột phải (split layout), không nằm trong editor.

import { WritingSupportLevelPicker } from "#/components/common/WritingSupportLevelPicker"
import type { WritingSupportLevel } from "#/lib/practice/writing-support-level"
import { cn } from "#/lib/utils"

interface Props {
	value: string
	onChange: (text: string) => void
	minWords: number
	maxWords: number
	wordCount: number
	disabled?: boolean
	supportLevel: WritingSupportLevel
}

export function WritingEditor({
	value,
	onChange,
	minWords,
	maxWords,
	wordCount,
	disabled,
	supportLevel,
}: Props) {
	const status = getCountStatus(wordCount, minWords, maxWords)
	return (
		<div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
			<div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
				<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Bài viết
				</span>
				<WritingSupportLevelPicker level={supportLevel} />
			</div>
			<textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				placeholder="Bắt đầu viết tại đây..."
				className="min-h-[420px] w-full flex-1 resize-none border-0 bg-transparent p-5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-70"
			/>
			<div className="flex items-center justify-between border-t bg-muted/20 px-4 py-2 text-xs">
				<span className="text-muted-foreground">
					Yêu cầu:{" "}
					<strong className="text-foreground">
						{minWords}-{maxWords}
					</strong>{" "}
					từ
				</span>
				<span className={cn("font-semibold tabular-nums", STATUS_CLASS[status])}>
					{wordCount} từ · {STATUS_LABEL[status]}
				</span>
			</div>
		</div>
	)
}

type CountStatus = "too_short" | "in_range" | "too_long"

const STATUS_CLASS: Record<CountStatus, string> = {
	too_short: "text-warning",
	in_range: "text-success",
	too_long: "text-destructive",
}

const STATUS_LABEL: Record<CountStatus, string> = {
	too_short: "Còn thiếu",
	in_range: "Trong giới hạn",
	too_long: "Vượt giới hạn",
}

function getCountStatus(count: number, min: number, max: number): CountStatus {
	if (count < min) return "too_short"
	if (count > max) return "too_long"
	return "in_range"
}
