import { cn } from "#/lib/utils"

interface SidebarItem {
	key: string
	label: string
	count: number
}

interface Props {
	items: SidebarItem[]
	activeKey: string
	onSelect: (key: string) => void
	accentClass?: string
}

export function SkillSidebar({ items, activeKey, onSelect, accentClass = "bg-primary-tint text-primary" }: Props) {
	return (
		<>
			{/* Desktop */}
			<nav className="hidden lg:block">
				<div className="sticky top-24 card p-3">
					<p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-subtle">Phân loại</p>
					<ul className="space-y-0.5">
						{items.map((item) => (
							<li key={item.key}>
								<button
									type="button"
									onClick={() => onSelect(item.key)}
									className={cn(
										"flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold transition",
										activeKey === item.key ? accentClass : "text-muted hover:bg-background",
									)}
								>
									<span className="truncate">{item.label}</span>
									<span className="ml-2 shrink-0 text-xs tabular-nums">{item.count}</span>
								</button>
							</li>
						))}
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
							"shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition",
							activeKey === item.key ? accentClass : "border-border text-muted hover:text-foreground",
						)}
					>
						{item.label} ({item.count})
					</button>
				))}
			</div>
		</>
	)
}
