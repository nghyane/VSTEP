import { Target } from "lucide-react"

export function DashboardGoalCard() {
	return (
		<div className="flex items-center gap-4 rounded-2xl bg-muted/50 p-5 shadow-sm">
			<Target className="size-6 text-primary" />
			<div>
				<p className="text-sm text-muted-foreground">Mục tiêu B2</p>
				<p className="text-lg font-bold">Còn 45 ngày</p>
			</div>
		</div>
	)
}
