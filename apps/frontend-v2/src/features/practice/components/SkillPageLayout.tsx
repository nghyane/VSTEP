// SkillPageLayout — shared components cho trang danh sách 4 kỹ năng.
// RFC 0008: depth border, skill-coded accent, 3D progress.

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"

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
	accentClass = "bg-primary/10 text-primary",
}: {
	items: readonly SidebarItem[]
	activeKey: string
	onSelect: (key: string) => void
	accentClass?: string
}) {
	return (
		<>
			{/* Desktop */}
			<nav className="hidden lg:block">
				<div className="sticky top-24 rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-3">
					<p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
						Phân loại
					</p>
					<ul className="space-y-0.5">
						{items.map((item) => {
							const active = activeKey === item.key
							return (
								<li key={item.key}>
									<button
										type="button"
										onClick={() => onSelect(item.key)}
										className={cn(
											"flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
											active
												? accentClass
												: "text-muted-foreground hover:bg-muted hover:text-foreground",
										)}
									>
										<span className="truncate">{item.label}</span>
										<span
											className={cn(
												"ml-2 shrink-0 text-xs font-bold tabular-nums",
												active ? "" : "text-muted-foreground",
											)}
										>
											{item.count}
										</span>
									</button>
								</li>
							)
						})}
					</ul>
				</div>
			</nav>

			{/* Mobile */}
			<div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
				{items.map((item) => (
					<button
						key={item.key}
						type="button"
						onClick={() => onSelect(item.key)}
						className={cn(
							"shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-colors",
							activeKey === item.key
								? accentClass
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
		<div className="flex items-center justify-center gap-2 pt-2">
			<Button
				size="icon"
				variant="outline"
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
				className="size-8 rounded-lg"
			>
				<ChevronLeft className="size-4" />
			</Button>
			<span className="text-sm font-medium tabular-nums text-muted-foreground">
				{page} / {totalPages}
			</span>
			<Button
				size="icon"
				variant="outline"
				disabled={page >= totalPages}
				onClick={() => onPageChange(page + 1)}
				className="size-8 rounded-lg"
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
	accentClass?: string
	status?: CardStatus
	score?: number
	total?: number
}) {
	const pct = total && total > 0 && score !== undefined ? Math.round((score / total) * 100) : 0
	const hasProgress = status !== "not_started" && total && total > 0

	return (
		<div className="group relative flex flex-col rounded-xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-4 transition-all hover:shadow-md">
			<div className="flex items-start gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-sm font-bold leading-snug text-foreground">{title}</p>
					<p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
				</div>
				{status !== "not_started" && <StatusBadge status={status} />}
			</div>

			<p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
				{description}
			</p>

			<div className="mt-3 space-y-2">
				{hasProgress && (
					<div>
						<div className="flex items-center justify-between text-xs tabular-nums text-muted-foreground">
							<span>
								{score}/{total} đúng
							</span>
							<span className="font-semibold">{pct}%</span>
						</div>
						<div className="mt-1 h-2 overflow-hidden rounded-full bg-muted shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
							<div
								className={cn(
									"h-full rounded-full transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]",
									pct >= 80 ? "bg-success" : pct >= 50 ? "bg-primary" : "bg-warning",
								)}
								style={{ width: `${pct}%` }}
							/>
						</div>
					</div>
				)}
				<Button
					size="sm"
					variant={status === "not_started" ? "default" : "outline"}
					className="pointer-events-none h-8 rounded-lg text-xs font-bold group-active:translate-y-[3px] group-active:border-b group-active:pb-[3px]"
				>
					{status === "completed" ? "Làm lại" : status === "in_progress" ? "Tiếp tục" : "Bắt đầu"}
				</Button>
			</div>

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
				"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
				isCompleted ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
			)}
		>
			{isCompleted ? "Hoàn thành" : "Đang làm"}
		</span>
	)
}

// ─── Constants ─────────────────────────────────────────────────────

export const ITEMS_PER_PAGE = 9
