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

export function ExerciseCard({
	title,
	description,
	meta,
	href,
}: {
	title: string
	description: string
	meta: string
	href: React.ReactNode
}) {
	return (
		<div className="group relative flex flex-col rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-border/80 hover:shadow-md">
			<p className="text-sm font-semibold leading-snug">{title}</p>
			<p className="mt-1 line-clamp-2 flex-1 text-xs text-muted-foreground">{description}</p>
			<p className="mt-3 text-xs text-muted-foreground">{meta}</p>
			{/* Overlay link */}
			{href}
		</div>
	)
}

// ─── Constants ─────────────────────────────────────────────────────

export const ITEMS_PER_PAGE = 9
