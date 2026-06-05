import { cn } from "#/lib/utils"

interface Props {
	examTitle: string
	skillLabel: string
	skillProgress: string
	autosaveLabel: string
	remainingSeconds: number
	answeredMcq: number
	totalMcq: number
	onExit: () => void
}

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60)
		.toString()
		.padStart(2, "0")
	const s = (seconds % 60).toString().padStart(2, "0")
	return `${m}:${s}`
}

export function ExamRoomHeader({
	examTitle,
	skillLabel,
	skillProgress,
	autosaveLabel,
	remainingSeconds,
	answeredMcq,
	totalMcq,
	onExit,
}: Props) {
	const isWarning = remainingSeconds <= 300
	const isUrgent = remainingSeconds <= 60

	return (
		<header className="z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-5">
			<div className="min-w-0 flex-1">
				<div className="flex min-w-0 items-center gap-2">
					<p className="truncate text-sm font-bold text-foreground">Đang làm {skillLabel}</p>
					<span className="hidden shrink-0 rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted sm:inline-flex">
						Kỹ năng {skillProgress}
					</span>
				</div>
				<p className="truncate text-xs text-muted">{examTitle}</p>
			</div>

			<div className="hidden items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-subtle lg:flex">
				<span className="size-2 rounded-full bg-success" />
				{autosaveLabel}
			</div>

			<div
				className={cn(
					"flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums transition-colors",
					isUrgent
						? "bg-destructive/15 text-destructive"
						: isWarning
							? "bg-warning/15 text-warning"
							: "bg-surface text-foreground",
				)}
			>
				<svg
					viewBox="0 0 16 16"
					className="size-3.5 shrink-0"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<circle cx="8" cy="9" r="6" />
					<path d="M8 6v3l2 1.5" />
					<path d="M6.5 2h3M8 2v1.5" />
				</svg>
				<span className="hidden text-xs font-semibold tabular-nums sm:inline">Còn</span>
				{formatTime(remainingSeconds)}
			</div>

			{totalMcq > 0 && (
				<div className="hidden items-center gap-1 text-sm md:flex">
					<span className="text-muted">Đã trả lời</span>
					<span className="font-bold tabular-nums text-foreground">{answeredMcq}</span>
					<span className="text-muted">/{totalMcq} câu</span>
				</div>
			)}

			<button
				type="button"
				onClick={onExit}
				className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface hover:text-foreground transition-colors"
				aria-label="Rời phòng thi"
			>
				<svg
					viewBox="0 0 16 16"
					className="size-4"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="M10.5 11.5L13.5 8l-3-3.5M13.5 8H6M6 2.5H3a1 1 0 00-1 1v9a1 1 0 001 1h3" />
				</svg>
				<span className="hidden sm:inline">Rời phòng</span>
			</button>
		</header>
	)
}
