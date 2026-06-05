import type { ReactNode } from "react"
import { cn } from "#/lib/utils"

export interface ExamRoomFooterAction {
	skillLabel: string
	skillProgress: string
	isLastSkill: boolean
	isSubmitting: boolean
	statusText: string
	nextLabel: string
	onSubmit: () => void
	onNext: () => void
	toneClass?: string
	context?: ReactNode
	nextTone?: "primary" | "secondary"
}

export function ExamRoomFooter({
	skillLabel,
	skillProgress,
	isLastSkill,
	isSubmitting,
	statusText,
	nextLabel,
	onSubmit,
	onNext,
	toneClass = "text-primary",
	context,
	nextTone = "primary",
}: ExamRoomFooterAction) {
	return (
		<div className="z-40 shrink-0 border-t border-border bg-card px-5 py-2">
			{context && (
				<div className="mb-2 flex flex-wrap items-center gap-3 border-b border-border-light pb-2">
					{context}
				</div>
			)}
			<div className="flex min-h-10 items-center justify-between gap-4">
				<p className="min-w-0 flex-1 truncate text-sm text-muted">{statusText}</p>
				<p className={cn("hidden shrink-0 text-sm font-extrabold sm:block", toneClass)}>
					{skillLabel}
					<span className="ml-1 text-xs font-normal text-muted">({skillProgress})</span>
				</p>
				{isLastSkill ? (
					<button
						type="button"
						onClick={onSubmit}
						disabled={isSubmitting}
						className="btn btn-primary disabled:opacity-60"
					>
						<svg
							viewBox="0 0 16 16"
							className="size-4"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<polyline points="2,8 6,12 14,4" />
						</svg>
						Nộp bài
					</button>
				) : (
					<button
						type="button"
						onClick={onNext}
						className={cn("btn", nextTone === "primary" ? "btn-primary" : "btn-secondary")}
					>
						{nextLabel}
						<svg
							viewBox="0 0 16 16"
							className="size-4"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M6 3l5 5-5 5" />
						</svg>
					</button>
				)}
			</div>
		</div>
	)
}
