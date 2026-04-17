// StreakDialog — hiển thị streak, tiến độ hôm nay, milestone thưởng xu.
// Mở khi click thanh tiến độ trong ExamCountdown.

import { Check, Lock } from "lucide-react"
import { toast } from "sonner"
import { AnimatedCoinIcon } from "#/components/common/AnimatedCoinIcon"
import { CoinIcon } from "#/components/common/CoinIcon"
import { FireIcon } from "#/components/common/FireIcon"
import { Button } from "#/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog"
import {
	claimMilestone,
	DAILY_GOAL,
	STREAK_MILESTONES,
	type StreakMilestone,
	useClaimedMilestones,
	useTodayProgress,
} from "#/lib/streak/streak-rewards"
import { cn } from "#/lib/utils"

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	streak: number
}

export function StreakDialog({ open, onOpenChange, streak }: Props) {
	const claimed = useClaimedMilestones()
	const rawToday = useTodayProgress()
	const todayDone = Math.min(DAILY_GOAL, rawToday)
	const todayRemaining = Math.max(0, DAILY_GOAL - todayDone)
	const todayPct = Math.round((todayDone / DAILY_GOAL) * 100)

	function handleClaim(milestone: StreakMilestone) {
		if (claimMilestone(milestone.days)) {
			toast.success(`+${milestone.coins} xu`, {
				description: `Phần thưởng chuỗi học ${milestone.days} ngày liên tục.`,
			})
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
				{/* Header */}
				<DialogHeader className="space-y-0">
					<DialogTitle className="sr-only">Chuỗi học tập</DialogTitle>
					<DialogDescription className="sr-only">
						Theo dõi streak và nhận thưởng xu khi duy trì học liên tục
					</DialogDescription>
					<div className="flex items-center gap-3">
						<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-skill-speaking/10">
							<FireIcon active={streak > 0} sizeClass="size-7" />
						</div>
						<div>
							<p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
								Streak của bạn
							</p>
							<p className="text-3xl font-extrabold leading-tight text-skill-speaking">
								{streak}
								<span className="ml-1 text-base font-semibold text-muted-foreground">ngày</span>
							</p>
						</div>
					</div>
				</DialogHeader>

				{/* Today progress */}
				<div className="space-y-2 rounded-xl bg-muted/50 p-4">
					<div className="flex items-center justify-between text-xs">
						<span className="font-semibold uppercase tracking-wide text-muted-foreground">
							Tiến độ hôm nay
						</span>
						<span
							className={cn(
								"font-bold tabular-nums",
								todayRemaining === 0 ? "text-emerald-600" : "text-amber-600",
							)}
						>
							{todayDone}/{DAILY_GOAL} đề thi thử
						</span>
					</div>
					<div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700/60">
						<div
							className={cn(
								"h-full rounded-full transition-all",
								todayRemaining === 0
									? "bg-gradient-to-r from-emerald-400 to-emerald-500"
									: "bg-gradient-to-r from-amber-400 to-amber-500",
							)}
							style={{ width: `${todayPct}%` }}
						/>
					</div>
					<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
						{todayRemaining === 0
							? "Hoàn thành! Streak được giữ hôm nay."
							: `Còn ${todayRemaining} đề thi thử nữa để giữ streak`}
					</p>
				</div>

				{/* Milestone rewards */}
				<div className="space-y-2">
					<p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						<span className="size-1.5 rounded-full bg-primary" />
						Mốc phần thưởng
					</p>
					<div className="space-y-2">
						{STREAK_MILESTONES.map((m) => (
							<MilestoneRow
								key={m.days}
								milestone={m}
								streak={streak}
								isClaimed={claimed.has(m.days)}
								onClaim={() => handleClaim(m)}
							/>
						))}
					</div>
				</div>

				{/* How to join */}
				<div className="space-y-2 rounded-xl border border-dashed border-border bg-muted/30 p-4">
					<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Cách tham gia
					</p>
					<ol className="space-y-1.5 text-xs text-foreground">
						{[
							`Hoàn thành ít nhất ${DAILY_GOAL} đề thi thử mỗi ngày`,
							"Không bỏ ngày nào để giữ streak",
							...STREAK_MILESTONES.map((m) => `Đạt mốc ${m.days} ngày → nhận ${m.coins} xu`),
						].map((note, i) => (
							<li key={note} className="flex gap-2">
								<span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
									{i + 1}
								</span>
								<span className="flex-1">{note}</span>
							</li>
						))}
					</ol>
				</div>
			</DialogContent>
		</Dialog>
	)
}

function MilestoneRow({
	milestone,
	streak,
	isClaimed,
	onClaim,
}: {
	milestone: StreakMilestone
	streak: number
	isClaimed: boolean
	onClaim: () => void
}) {
	const progress = Math.min(milestone.days, streak)
	const pct = Math.round((progress / milestone.days) * 100)
	const canClaim = streak >= milestone.days && !isClaimed

	return (
		<div
			className={cn(
				"space-y-2 rounded-xl border bg-card p-3 transition-colors",
				canClaim && "border-amber-300 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-950/30",
				isClaimed && "opacity-60",
			)}
		>
			<div className="flex items-center gap-3">
				<span
					className={cn(
						"flex size-9 shrink-0 items-center justify-center rounded-full",
						canClaim
							? "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300"
							: isClaimed
								? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300"
								: "bg-muted text-muted-foreground",
					)}
				>
					{isClaimed ? (
						<Check className="size-4" strokeWidth={3} />
					) : canClaim ? (
						<AnimatedCoinIcon size={22} />
					) : (
						<Lock className="size-4" />
					)}
				</span>
				<div className="min-w-0 flex-1">
					<p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
						{milestone.days} ngày streak
					</p>
					<p className="text-sm font-bold text-foreground">
						<span className="inline-flex items-center gap-1">
							<span className="flex size-4 items-center justify-center">
								<CoinIcon size={14} className="-translate-y-px" />
							</span>
							<span className="leading-none">+{milestone.coins} xu</span>
						</span>
					</p>
				</div>
				<div className="shrink-0 text-right">
					{isClaimed ? (
						<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
							<Check className="size-3" strokeWidth={3} />
							Đã nhận
						</span>
					) : canClaim ? (
						<Button size="sm" className="h-7 px-2.5 text-xs font-bold" onClick={onClaim}>
							Nhận xu
						</Button>
					) : (
						<span className="text-[11px] font-bold tabular-nums text-muted-foreground">
							{progress}/{milestone.days}
						</span>
					)}
				</div>
			</div>
			{!isClaimed && (
				<div className="h-1 w-full overflow-hidden rounded-full bg-muted">
					<div
						className={cn(
							"h-full rounded-full transition-all",
							canClaim
								? "bg-gradient-to-r from-amber-400 to-amber-500"
								: "bg-gradient-to-r from-slate-300 to-slate-400",
						)}
						style={{ width: `${pct}%` }}
					/>
				</div>
			)}
		</div>
	)
}
