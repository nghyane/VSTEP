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

/**
 * Pill-style tab row — Duolingo pattern: không container wrapper,
 * mỗi tab là pill border-2, active dùng màu, inactive subtle.
 */
export function SegmentedTabs<T extends string>({ items, value, onChange }: Props<T>) {
	return (
		<div className="flex items-center gap-1.5">
			{items.map((item) => {
				const active = item.value === value
				return (
					<button
						key={item.value}
						type="button"
						aria-pressed={active}
						onClick={() => onChange(item.value)}
						className={cn(
							"inline-flex min-h-10 items-center gap-2 rounded-(--radius-button) border-2 px-4 py-1.5 text-sm font-extrabold transition-colors cursor-pointer",
							active
								? "border-primary/35 bg-primary-tint text-primary-dark"
								: "border-border bg-surface text-muted hover:border-border-focus hover:text-foreground",
						)}
					>
						{item.label}
						{item.count !== undefined && <TabCount count={item.count} />}
					</button>
				)
			})}
		</div>
	)
}

function TabCount({ count }: { count: number }) {
	return (
		<span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1.5 text-xs leading-none tabular-nums text-muted">
			{count}
		</span>
	)
}
