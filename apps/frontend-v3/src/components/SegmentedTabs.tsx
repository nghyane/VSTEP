import { cn } from "#/lib/utils"

export interface SegmentedTabItem<T extends string> {
	value: T
	label: string
	count?: number
}

interface Props<T extends string> {
	items: SegmentedTabItem<T>[]
	value: T
	onChange: (value: T) => void
}

export function SegmentedTabs<T extends string>({ items, value, onChange }: Props<T>) {
	return (
		<div className="inline-flex items-center gap-1 rounded-(--radius-card) border-2 border-b-4 border-border bg-surface p-1">
			{items.map((item) => {
				const active = item.value === value
				return (
					<button
						key={item.value}
						type="button"
						aria-pressed={active}
						onClick={() => onChange(item.value)}
						className={cn(
							"inline-flex min-h-10 items-center gap-2 rounded-(--radius-button) border-2 border-b-4 px-4 py-1.5 text-sm font-extrabold transition-all active:translate-y-[1px]",
							active
								? "border-primary/35 bg-background text-primary-dark shadow-sm"
								: "border-transparent bg-transparent text-muted hover:bg-background/70 hover:text-foreground",
						)}
					>
						{item.label}
						{item.count !== undefined && <SegmentedTabCount active={active} count={item.count} />}
					</button>
				)
			})}
		</div>
	)
}

function SegmentedTabCount({ active, count }: { active: boolean; count: number }) {
	return (
		<span
			className={cn(
				"inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 px-1.5 text-xs leading-none tabular-nums",
				active
					? "border-primary/20 bg-primary-tint text-primary-dark"
					: "border-border bg-background text-muted",
			)}
		>
			{count}
		</span>
	)
}
