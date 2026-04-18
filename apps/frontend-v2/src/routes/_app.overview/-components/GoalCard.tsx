// GoalCard — empty state + filled state
// Spec: rounded-2xl bg-muted/50 p-8 shadow-sm (empty) / p-5 (filled)
// Source: GoalCard.tsx

import { CircleCheck, Clock, Plus, Target } from "lucide-react"
import { Button } from "#/components/ui/button"
import type { EnrichedGoal } from "#/lib/mock/overview"
import { cn } from "#/lib/utils"

interface Props {
	goal: EnrichedGoal | null
}

export function GoalCard({ goal }: Props) {
	if (!goal) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-muted/50 p-8 shadow-sm">
				<Target className="size-6 text-primary" />
				<p className="text-sm text-muted-foreground">Bạn chưa đặt mục tiêu học tập</p>
				<Button size="sm">Đặt mục tiêu</Button>
			</div>
		)
	}

	const deadlineLabel = new Date(goal.deadline).toLocaleDateString("vi-VN", {
		day: "numeric",
		month: "long",
		year: "numeric",
	})
	const isExpired = goal.daysRemaining != null && goal.daysRemaining <= 0

	return (
		<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Target className="size-6 text-primary" />
					<div>
						<h3 className="text-lg font-semibold">Mục tiêu: {goal.targetBand}</h3>
						<p className="text-sm text-muted-foreground">
							{goal.currentEstimatedBand && `Hiện tại: ${goal.currentEstimatedBand} · `}
							Hạn: {deadlineLabel}
						</p>
					</div>
				</div>
				{isExpired && (
					<Button type="button" variant="ghost" size="sm">
						Đặt mục tiêu mới
					</Button>
				)}
			</div>

			{/* 3 mini stats */}
			<div className="mt-4 grid grid-cols-3 gap-4">
				<div className="rounded-xl bg-muted/50 p-3 text-center">
					<p className="text-xs text-muted-foreground">Thời gian học/ngày</p>
					<p className="mt-1 text-lg font-bold">{goal.dailyStudyTimeMinutes ?? "—"} phút</p>
				</div>
				<div className="rounded-xl bg-muted/50 p-3 text-center">
					<p className="text-xs text-muted-foreground">Còn lại</p>
					<p className="mt-1 text-lg font-bold">
						{isExpired
							? "Hết hạn"
							: goal.daysRemaining != null
								? `${goal.daysRemaining} ngày`
								: "—"}
					</p>
				</div>
				<div className="rounded-xl bg-muted/50 p-3 text-center">
					<p className="text-xs text-muted-foreground">Tiến độ</p>
					<div className="mt-1 flex items-center justify-center gap-1.5">
						<GoalStatus goal={goal} isExpired={isExpired} />
					</div>
				</div>
			</div>

			{/* Expired notice */}
			{isExpired && (
				<div className="mt-4 flex items-center justify-between rounded-xl border border-dashed p-3">
					<p className="text-sm text-muted-foreground">
						Mục tiêu đã kết thúc. Hãy đặt mục tiêu mới!
					</p>
					<Button size="sm">
						<Plus className="size-4" />
						Mục tiêu mới
					</Button>
				</div>
			)}
		</div>
	)
}

function GoalStatus({ goal, isExpired }: { goal: EnrichedGoal; isExpired: boolean }) {
	if (goal.achieved) {
		return (
			<>
				<CircleCheck className={cn("size-5", "text-success")} />
				<span className="text-sm font-bold text-success">Đạt</span>
			</>
		)
	}
	if (isExpired) {
		return (
			<>
				<Clock className="size-5 text-muted-foreground" />
				<span className="text-sm font-bold text-muted-foreground">Đã kết thúc</span>
			</>
		)
	}
	if (goal.onTrack === true) {
		return (
			<>
				<CircleCheck className="size-5 text-primary" />
				<span className="text-sm font-bold text-primary">Đúng tiến độ</span>
			</>
		)
	}
	if (goal.onTrack === false) {
		return (
			<>
				<Clock className="size-5 text-warning" />
				<span className="text-sm font-bold text-warning">Cần cố gắng</span>
			</>
		)
	}
	return <span className="text-sm font-bold text-muted-foreground">—</span>
}
