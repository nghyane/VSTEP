// SkillPageLayout — 2-column layout dùng chung cho trang danh sách 4 kỹ năng.
// Sidebar trái: danh sách Part/Level. Content phải: grid bài tập + pagination.

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "#/components/ui/button"
import { cn } from "#/lib/utils"


// ─── Sidebar ───────────────────────────────────────────────────────

interface SidebarItem {
	key: string
	label: string
	count: number
}

export function SkillSidebar({
	items,
	activeKey,
	onSelect,
	colorClass,
}: {
	items: readonly SidebarItem[]
	activeKey: string
	onSelect: (key: string) => void
	colorClass: string
}) {
	return (
		<>
			{/* Desktop: vertical sidebar */}
			<nav className="hidden lg:block">
				<ul className="sticky top-24 space-y-1">
					{items.map((item) => (
						<li key={item.key}>
							<button
								type="button"
								onClick={() => onSelect(item.key)}
								className={cn(
									"flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
									activeKey === item.key
										? `${colorClass} font-semibold`
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								<span className="truncate">{item.label}</span>
								<span
									className={cn(
										"ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
										activeKey === item.key
											? "bg-background/60"
											: "bg-muted text-muted-foreground",
									)}
								>
									{item.count}
								</span>
							</button>
						</li>
					))}
				</ul>
			</nav>

			{/* Mobile: horizontal tabs */}
			<div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
				{items.map((item) => (
					<button
						key={item.key}
						type="button"
						onClick={() => onSelect(item.key)}
						className={cn(
							"shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
							activeKey === item.key
								? `${colorClass} border-current`
								: "border-border text-muted-foreground hover:text-foreground",
						)}
					>
						{item.label} ({item.count})
					</button>
				))}
			</div>
		</>
	)
}

// ─── Pagination ────────────────────────────────────────────────────

export function Pagination({
	page,
	totalPages,
	onPageChange,
}: {
	page: number
	totalPages: number
	onPageChange: (p: number) => void
}) {
	if (totalPages <= 1) return null

	return (
		<div className="flex items-center justify-center gap-1.5">
			<Button
				size="icon"
				variant="ghost"
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
				className="size-8"
			>
				<ChevronLeft className="size-4" />
			</Button>
			{Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
				<Button
					key={p}
					size="icon"
					variant={p === page ? "default" : "ghost"}
					onClick={() => onPageChange(p)}
					className="size-8 text-xs"
				>
					{p}
				</Button>
			))}
			<Button
				size="icon"
				variant="ghost"
				disabled={page >= totalPages}
				onClick={() => onPageChange(page + 1)}
				className="size-8"
			>
				<ChevronRight className="size-4" />
			</Button>
		</div>
	)
}

// ─── Exercise Card ─────────────────────────────────────────────────

export type CardStatus = "not_started" | "in_progress" | "completed"

export function ExerciseCard({
	title,
	description,
	meta,
	href,
	status = "not_started",
	score,
	total,
}: {
	title: string
	description: string
	meta: string
	href: React.ReactNode
	status?: CardStatus
	/** Score (correct answers / shadowing done) */
	score?: number
	/** Total questions / sentences */
	total?: number
}) {
	const pct = total && total > 0 && score !== undefined ? Math.round((score / total) * 100) : 0
	const hasProgress = status !== "not_started" && total && total > 0

	return (
		<div className="group relative flex flex-col rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-border/80 hover:shadow-md">
			<div className="flex items-start justify-between gap-2">
				<p className="min-w-0 text-sm font-semibold leading-snug">{title}</p>
				<StatusBadge status={status} />
			</div>
			<p className="mt-1 line-clamp-2 flex-1 text-xs text-muted-foreground">{description}</p>
			<div className="mt-3 flex items-center justify-between gap-2">
				<span className="text-xs text-muted-foreground">{meta}</span>
				{total !== undefined && total > 0 && (
					<span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
						{total} câu
					</span>
				)}
			</div>
			{hasProgress && (
				<div className="mt-2.5">
					<div className="flex items-center justify-between text-[11px] tabular-nums text-muted-foreground">
						<span>{score}/{total} đúng</span>
						<span>{pct}%</span>
					</div>
					<div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
						<div
							className={cn(
								"h-full rounded-full transition-all",
								pct >= 80 ? "bg-success" : pct >= 50 ? "bg-primary" : "bg-warning",
							)}
							style={{ width: `${pct}%` }}
						/>
					</div>
				</div>
			)}
			{href}
		</div>
	)
}

function StatusBadge({ status }: { status: CardStatus }) {
	if (status === "not_started") return null
	const isCompleted = status === "completed"
	return (
		<span
			className={cn(
				"shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
				isCompleted
					? "bg-success/10 text-success"
					: "bg-warning/10 text-warning",
			)}
		>
			{isCompleted ? "Hoàn thành" : "Đang làm"}
		</span>
	)
}

// ─── Constants ─────────────────────────────────────────────────────

export const ITEMS_PER_PAGE = 9
