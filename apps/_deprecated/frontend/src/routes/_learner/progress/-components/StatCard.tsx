import type { IconSvgElement } from "@hugeicons/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"

interface StatCardProps {
	icon: IconSvgElement
	iconBg: string
	label: string
	value: string
	valueColor: string
}

export function StatCard({ icon, iconBg, label, value, valueColor }: StatCardProps) {
	return (
		<div className="rounded-2xl bg-muted/50 p-4">
			<div className="flex items-center gap-3">
				<div className={cn("flex size-10 items-center justify-center rounded-xl", iconBg)}>
					<HugeiconsIcon icon={icon} className="size-5" />
				</div>
				<div>
					<p className="text-sm text-muted-foreground">{label}</p>
					<p className={cn("text-lg font-bold", valueColor)}>{value}</p>
				</div>
			</div>
		</div>
	)
}
