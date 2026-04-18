// SkillPageLayout — shared components cho trang danh sách 4 kỹ năng.

import { ChevronLeft, ChevronRight, FileText } from "lucide-react"
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
}: {
	items: readonly SidebarItem[]
	activeKey: string
	onSelect: (key: string) => void
}) {
	return (
		<>
			{/* Desktop */}
			<nav className="hidden lg:block">
				<div className="sticky top-24 rounded-2xl bg-muted/50 p-3 shadow-sm">
					<p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
						Loại câu hỏi
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
											"flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
											active
												? "bg-background font-semibold text-foreground shadow-sm"
												: "text-muted-foreground hover:bg-background/50 hover:text-foreground",
										)}
									>
										<span className="truncate">{item.label}</span>
										<span className="ml-2 shrink-0 text-[11px] tabular-nums text-muted-foreground">
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
							"shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
							activeKey === item.key
								? "border-primary bg-primary/5 font-semibold text-primary"
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
			<span className="text-sm tabular-nums text-muted-foreground">
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
	const pct = total && total > 0 && score !== undefined
		? Math.round((score / total) * 100)
		: 0
	const hasProgress = status !== "not_started" && total && total > 0

	return (
		<div className="group relative flex flex-col rounded-xl border bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-md">
			{/* Header: icon + title + status */}
			<div className="flex items-start gap-3">
				<FileText className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold leading-snug">{title}</p>
					<p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
				</div>
				{status !== "not_started" && <StatusBadge status={status} />}
			</div>

			{/* Description — flex-1 pushes bottom content down */}
			<p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
				{description}
			</p>

			{/* Bottom area — always pinned to bottom */}
			<div className="mt-3 space-y-2">
				{hasProgress && (
					<div>
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
				<Button size="sm" variant={status === "not_started" ? "default" : "outline"} className="pointer-events-none h-8 rounded-lg text-xs">
					{status === "completed" ? "Làm lại" : status === "in_progress" ? "Tiếp tục" : "Bắt đầu"}
				</Button>
			</div>

			{/* Overlay link */}
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
