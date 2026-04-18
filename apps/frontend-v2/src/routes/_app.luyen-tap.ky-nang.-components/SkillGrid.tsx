// SkillGrid + GridFooter — shared layout cho skill content panels.

import { Pagination, SkillSidebar } from "#/features/practice/components/SkillPageLayout"

export function SkillGrid({
	sidebarItems,
	activeKey,
	onSelect,
	headerLabel,
	totalCount,
	accentClass,
	children,
}: {
	sidebarItems: { key: string; label: string; count: number }[]
	activeKey: string
	onSelect: (key: string) => void
	headerLabel: string
	totalCount: number
	accentClass?: string
	children: React.ReactNode
}) {
	return (
		<div className="grid gap-6 lg:grid-cols-[220px_1fr]">
			<SkillSidebar items={sidebarItems} activeKey={activeKey} onSelect={onSelect} accentClass={accentClass} />
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<p className="text-sm font-medium">{headerLabel}</p>
					<p className="text-xs text-muted-foreground">{totalCount} bài</p>
				</div>
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
			</div>
		</div>
	)
}

export function GridFooter({
	count,
	page,
	totalPages,
	onPageChange,
}: {
	count: number
	page: number
	totalPages: number
	onPageChange: (p: number) => void
}) {
	if (count === 0) {
		return (
			<p className="col-span-full py-12 text-center text-sm text-muted-foreground">
				Chưa có bài tập cho phần này.
			</p>
		)
	}
	if (totalPages <= 1) return null
	return (
		<div className="col-span-full">
			<Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
		</div>
	)
}
