import { cn } from "#/lib/utils"

interface TabItem {
	label: string
	value: string
}

interface Props {
	tabs: TabItem[]
	active: string
	onChange: (value: string) => void
	className?: string
}

export function Tabs({ tabs, active, onChange, className }: Props) {
	return (
		<div className={cn("flex gap-1 border-b border-border", className)}>
			{tabs.map((tab) => (
				<button
					key={tab.value}
					type="button"
					className={cn(
						"border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted transition-colors",
						"hover:text-foreground",
						tab.value === active && "border-primary text-primary",
					)}
					onClick={() => onChange(tab.value)}
				>
					{tab.label}
				</button>
			))}
		</div>
	)
}
