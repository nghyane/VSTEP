import { Link } from "@tanstack/react-router"
import { cn } from "#/lib/utils"

interface Props {
	remainingSeconds: number
	answeredMcq: number
	totalMcq: number
	examTitle: string
}

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60)
		.toString()
		.padStart(2, "0")
	const s = (seconds % 60).toString().padStart(2, "0")
	return `${m}:${s}`
}

export function ExamRoomHeader({ remainingSeconds, answeredMcq, totalMcq, examTitle }: Props) {
	const isWarning = remainingSeconds <= 300
	const isUrgent = remainingSeconds <= 60

	return (
		<header className="z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-5">
			{/* Timer */}
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
				{formatTime(remainingSeconds)}
			</div>

			{/* Exam title (center, truncate) */}
			<p className="mx-4 hidden max-w-xs truncate text-sm font-semibold text-foreground sm:block">
				{examTitle}
			</p>

			{/* Progress */}
			<div className="flex items-center gap-1 text-sm">
				<span className="font-bold tabular-nums text-foreground">{answeredMcq}</span>
				<span className="text-muted">/{totalMcq} câu</span>
			</div>

			{/* Exit */}
			<Link
				to="/thi-thu"
				className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface hover:text-foreground transition-colors"
				aria-label="Thoát"
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
				<span className="hidden sm:inline">Thoát</span>
			</Link>
		</header>
	)
}
