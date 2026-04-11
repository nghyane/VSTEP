// WritingEditor — textarea lớn + word counter theo range.

import { cn } from "#/lib/utils"

interface Props {
	value: string
	onChange: (text: string) => void
	minWords: number
	maxWords: number
	wordCount: number
	disabled?: boolean
}

export function WritingEditor({ value, onChange, minWords, maxWords, wordCount, disabled }: Props) {
	const status = getCountStatus(wordCount, minWords, maxWords)
	return (
		<div className="space-y-2">
			<textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				placeholder="Bắt đầu viết tại đây..."
				rows={14}
				className="w-full resize-y rounded-2xl border border-border bg-card p-5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-70"
			/>
			<div className="flex items-center justify-between text-xs">
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
