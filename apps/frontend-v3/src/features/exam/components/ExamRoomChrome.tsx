import type { ReactNode } from "react"
import { cn } from "#/lib/utils"

type ExamRoomTone = "listening" | "reading" | "writing" | "speaking"

const BADGE_TONE_CLASS: Record<ExamRoomTone, string> = {
	listening: "border-skill-listening/30 bg-skill-listening/10 text-skill-listening",
	reading: "border-skill-reading/30 bg-skill-reading/10 text-skill-reading",
	writing: "border-skill-writing/30 bg-skill-writing/10 text-skill-writing",
	speaking: "border-skill-speaking/30 bg-skill-speaking/10 text-skill-speaking",
}

export function ExamRoomSkillBadge({ tone, children }: { tone: ExamRoomTone; children: ReactNode }) {
	return (
		<span className={cn("rounded-full border px-3 py-1 text-xs font-bold", BADGE_TONE_CLASS[tone])}>
			{children}
		</span>
	)
}

export interface ExamRoomJumpItem {
	id: string
	label: ReactNode
	answered: boolean
	active?: boolean
	tone?: "correct" | "wrong"
	onClick: () => void
}

export function ExamRoomQuestionNav({ items, className }: { items: ExamRoomJumpItem[]; className?: string }) {
	return (
		<div className={cn("flex flex-wrap gap-1.5", className)}>
			{items.map((item) => {
				const toneClass = item.tone
					? item.tone === "correct"
						? "border-primary/45 bg-surface text-primary-dark"
						: "border-destructive/35 bg-destructive-tint text-destructive"
					: item.answered
						? "border-primary/35 bg-primary-tint text-primary-dark"
						: "border-border bg-surface text-muted hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
				return (
					<button
						key={item.id}
						type="button"
						onClick={item.onClick}
						className={cn(
							"flex size-8 items-center justify-center rounded-(--radius-button) border text-xs font-bold transition-colors",
							toneClass,
							item.active && "ring-2 ring-primary/35 ring-offset-1 ring-offset-background",
						)}
					>
						{item.label}
					</button>
				)
			})}
		</div>
	)
}

export interface ExamRoomProgressTabItem {
	id: string
	label: ReactNode
	meta?: ReactNode
	progressPct?: number
	emphasis?: boolean
}

export function ExamRoomProgressTabs({
	items,
	activeId,
	onChange,
	className,
}: {
	items: ExamRoomProgressTabItem[]
	activeId: string | null
	onChange: (id: string) => void
	className?: string
}) {
	return (
		<div className={cn("flex items-center gap-1.5 overflow-x-auto", className)}>
			{items.map((item) => {
				const active = item.id === activeId
				const hasProgress = item.progressPct !== undefined
				const progressPct = Math.max(0, Math.min(100, item.progressPct ?? 0))
				return (
					<button
						key={item.id}
						type="button"
						aria-pressed={active}
						onClick={() => onChange(item.id)}
						className={cn(
							"relative overflow-hidden rounded-(--radius-button) border px-3 pb-2.5 pt-1.5 text-xs font-bold transition-colors",
							active
								? "border-primary/35 bg-primary-tint text-primary-dark"
								: "border-border bg-surface text-muted hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
						)}
					>
						<span className="inline-flex items-center gap-1.5">
							{item.label}
							{item.meta && <span className="opacity-80">{item.meta}</span>}
						</span>
						{hasProgress && (
							<span
								className={cn(
									"absolute inset-x-0 bottom-0 h-1 overflow-hidden transition-opacity",
									item.emphasis && "animate-pulse",
									active ? "bg-primary/15" : "bg-primary/10",
								)}
							>
								<span
									className={cn("block h-full transition-[width] duration-300", "bg-primary/70")}
									style={{ width: `${progressPct}%` }}
								/>
							</span>
						)}
					</button>
				)
			})}
		</div>
	)
}

export function ExamRoomSubNav({
	leading,
	children,
	trailing,
}: {
	leading?: ReactNode
	children: ReactNode
	trailing?: ReactNode
}) {
	return (
		<div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-2.5">
			<div className="min-w-0 flex-1">{leading}</div>
			<div className="shrink-0">{children}</div>
			<div className="flex min-w-0 flex-1 justify-end">{trailing}</div>
		</div>
	)
}
