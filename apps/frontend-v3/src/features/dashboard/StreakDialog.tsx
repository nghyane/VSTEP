import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { DuoProgressBar } from "#/components/DuoProgressBar"
import { Icon, StaticIcon } from "#/components/Icon"
import { ScrollArea } from "#/components/ScrollArea"
import { claimStreakMilestone } from "#/features/dashboard/actions"
import type { StreakData, StreakMilestone } from "#/features/dashboard/types"
import { useWelcomeGift } from "#/features/onboarding/use-welcome-gift"
import { useCoinGain } from "#/lib/coin-gain"
import { useToast } from "#/lib/toast"
import { cn } from "#/lib/utils"

// Mốc 30 dùng chest icon + popup lớn; các mốc nhỏ dùng coin + burst inline.
const CHEST_DAYS = 30

interface Props {
	open: boolean
	onClose: () => void
	streak: StreakData
}

export function StreakDialog({ open, onClose, streak }: Props) {
	const qc = useQueryClient()
	const [burstDays, setBurstDays] = useState<number | null>(null)

	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [open, onClose])

	const claimMutation = useMutation({
		mutationFn: (m: StreakMilestone) => claimStreakMilestone(m.days),
		onSuccess: (result, m) => {
			qc.invalidateQueries({ queryKey: ["streak"] })
			qc.invalidateQueries({ queryKey: ["wallet", "balance"] })

			if (m.days === CHEST_DAYS) {
				onClose()
				setTimeout(() => useWelcomeGift.getState().show(result.coins_granted, "streak-30"), 240)
				return
			}

			setBurstDays(m.days)
			setTimeout(() => setBurstDays(null), 1200)
			useToast.getState().add(`+${result.coins_granted} xu — phần thưởng mốc ${m.days} ngày!`, "success")
			setTimeout(() => useCoinGain.getState().trigger(result.coins_granted), 220)
		},
	})

	function handleClaim(m: StreakMilestone) {
		if (m.claimed || claimMutation.isPending) return
		claimMutation.mutate(m)
	}

	if (typeof document === "undefined" || !open) return null

	const currentStreak = streak.current_streak
	const goal = streak.daily_goal
	const done = Math.min(goal, streak.today_sessions)
	const todayPct = goal > 0 ? Math.round((done / goal) * 100) : 0
	const remaining = Math.max(0, goal - done)
	const goalReached = remaining === 0

	return createPortal(
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_200ms_ease-out] p-4"
			role="dialog"
			aria-modal="true"
			aria-label="Chuỗi học tập"
			onClick={onClose}
			onKeyDown={(e) => e.key === "Escape" && onClose()}
		>
			<div
				className="card relative w-full max-w-2xl max-h-[88vh] overflow-hidden animate-[popIn_300ms_cubic-bezier(0.34,1.56,0.64,1)]"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				role="presentation"
			>
				<button
					type="button"
					onClick={onClose}
					aria-label="Đóng"
					className="absolute top-4 right-4 p-2 rounded-full hover:bg-background transition z-10"
				>
					<Icon name="close" size="sm" className="text-muted" />
				</button>

				<ScrollArea maxHeight="88vh">
					<div className="grid gap-4 p-6">
						<div className="flex items-center gap-3">
							<div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-streak-tint border-2 border-streak/30 border-b-4">
								<StaticIcon name="streak-md" size="md" />
							</div>
							<div>
								<p className="text-xs font-bold uppercase tracking-wider text-subtle">Streak của bạn</p>
								<p className="text-3xl font-extrabold leading-tight text-streak">
									{currentStreak}
									<span className="ml-1 text-base font-bold text-subtle">ngày</span>
								</p>
							</div>
						</div>

						<div className="card p-4 space-y-2">
							<div className="flex items-center justify-between text-xs">
								<span className="font-bold uppercase tracking-wide text-subtle">Tiến độ hôm nay</span>
								<span
									className={cn("font-extrabold tabular-nums", goalReached ? "text-primary" : "text-warning")}
								>
									{done}/{goal} bài thi
								</span>
							</div>
							<DuoProgressBar
								value={todayPct}
								tone={goalReached ? "primary" : "warning"}
								heightPx={16}
								label="Tiến độ giữ streak hôm nay"
							/>
							<p className="text-xs text-muted">
								{goalReached
									? "Hoàn thành! Streak được giữ hôm nay."
									: `Còn ${remaining} bài thi nữa để giữ streak`}
							</p>
						</div>

						<div className="space-y-2">
							<p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-subtle">
								<span className="size-1.5 rounded-full bg-primary" />
								Mốc phần thưởng
							</p>
							<div className="space-y-2">
								{streak.milestones.map((m) => (
									<MilestoneRow
										key={m.days}
										milestone={m}
										streak={currentStreak}
										isBursting={burstDays === m.days}
										isPending={claimMutation.isPending && claimMutation.variables?.days === m.days}
										onClaim={() => handleClaim(m)}
									/>
								))}
							</div>
						</div>

						<div className="rounded-(--radius-card) border-2 border-dashed border-border bg-background p-4 space-y-2">
							<p className="text-xs font-bold uppercase tracking-wider text-subtle">Cách tham gia</p>
							<ol className="space-y-1.5 text-xs text-foreground">
								{[
									`Hoàn thành ít nhất ${goal} bài thi mỗi ngày`,
									"Không bỏ ngày nào để giữ streak",
									...streak.milestones.map((m) => `Đạt mốc ${m.days} ngày → nhận ${m.coins} xu`),
								].map((note, i) => (
									<li key={note} className="flex gap-2">
										<span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-info-tint text-[10px] font-extrabold text-info">
											{i + 1}
										</span>
										<span className="flex-1">{note}</span>
									</li>
								))}
							</ol>
						</div>
					</div>
				</ScrollArea>
			</div>
		</div>,
		document.body,
	)
}

function MilestoneRow({
	milestone,
	streak,
	isBursting,
	isPending,
	onClaim,
}: {
	milestone: StreakMilestone
	streak: number
	isBursting: boolean
	isPending: boolean
	onClaim: () => void
}) {
	const progress = Math.min(milestone.days, streak)
	const pct = Math.round((progress / milestone.days) * 100)
	const reached = streak >= milestone.days
	const isClaimed = milestone.claimed
	const canClaim = reached && !isClaimed
	const isChest = milestone.days === CHEST_DAYS

	return (
		<div
			className={cn(
				"card p-3 space-y-2 transition-colors",
				canClaim && "border-coin/50 bg-coin-tint/60",
				isClaimed && "opacity-60",
			)}
		>
			<div className="flex items-center gap-3">
				<span
					className={cn(
						"relative flex size-10 shrink-0 items-center justify-center rounded-full border-2",
						isClaimed
							? "border-primary/30 bg-primary-tint"
							: canClaim
								? "border-coin/50 bg-coin-tint"
								: "border-border bg-background",
					)}
				>
					{isBursting && (
						<>
							<span
								aria-hidden
								className="pointer-events-none absolute inset-0 rounded-full bg-coin/40 animate-[coinPulseRing_900ms_ease-out_forwards]"
							/>
							{[...Array(8)].map((_, i) => (
								<span
									key={i}
									aria-hidden
									className="pointer-events-none absolute left-1/2 top-1/2"
									style={{
										animation: `coinBurst 800ms ease-out forwards`,
										animationDelay: `${i * 30}ms`,
										// @ts-expect-error -- CSS custom property
										"--angle": `${(i / 8) * 360}deg`,
										"--dist": `${28 + (i % 3) * 6}px`,
									}}
								>
									<StaticIcon name="coin" size="xs" className="h-3 w-auto" />
								</span>
							))}
						</>
					)}
					{isClaimed ? (
						isChest ? (
							<StaticIcon name="chest-open" size="sm" />
						) : (
							<Icon name="check" size="sm" className="text-primary-dark" />
						)
					) : (
						<StaticIcon
							name={isChest ? "chest" : "coin"}
							size={isChest ? "sm" : "xs"}
							className={cn(
								canClaim ? "animate-[coinPinch_900ms_ease-in-out_infinite]" : "opacity-40 grayscale",
							)}
						/>
					)}
				</span>
				<div className="min-w-0 flex-1">
					<p className="text-xs font-bold uppercase tracking-wide text-subtle">
						{milestone.days} ngày streak
					</p>
					<p className="inline-flex items-center gap-1 text-sm font-extrabold text-foreground">
						<StaticIcon name="coin" size="xs" />
						<span className="leading-none">+{milestone.coins} xu</span>
					</p>
				</div>
				<div className="shrink-0 text-right">
					{isClaimed ? (
						<span className="inline-flex items-center gap-1 rounded-full bg-primary-tint px-2 py-0.5 text-xs font-extrabold uppercase text-primary-dark">
							<Icon name="check" size="xs" />
							Đã nhận
						</span>
					) : canClaim ? (
						<button
							type="button"
							onClick={onClaim}
							disabled={isPending}
							className="btn btn-primary text-xs px-3 py-1.5 leading-none disabled:opacity-60 disabled:cursor-not-allowed"
						>
							{isPending ? "Đang nhận…" : "Nhận xu"}
						</button>
					) : (
						<span className="text-xs font-extrabold tabular-nums text-subtle">
							{progress}/{milestone.days}
						</span>
					)}
				</div>
			</div>
			{!reached && (
				<DuoProgressBar value={pct} tone="streak" heightPx={12} label={`Tiến tới ${milestone.days} ngày`} />
			)}
		</div>
	)
}
