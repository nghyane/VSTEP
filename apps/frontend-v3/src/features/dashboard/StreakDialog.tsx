import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { DuoProgressBar } from "#/components/DuoProgressBar"
import { Icon, StaticIcon } from "#/components/Icon"
import { ScrollArea } from "#/components/ScrollArea"
import type { StreakData } from "#/features/dashboard/types"
import { useWelcomeGift } from "#/features/onboarding/use-welcome-gift"
import { useCoinGain } from "#/lib/coin-gain"
import { useToast } from "#/lib/toast"
import { cn } from "#/lib/utils"

// TODO: claim state lưu localStorage tạm — thay bằng API khi BE có endpoint claim milestone.
const CLAIM_KEY = "vstep:streak-claimed:v1"

function loadClaimed(): Set<number> {
	if (typeof window === "undefined") return new Set()
	try {
		const raw = localStorage.getItem(CLAIM_KEY)
		if (!raw) return new Set()
		const arr = JSON.parse(raw) as unknown
		return Array.isArray(arr) ? new Set(arr.filter((n): n is number => typeof n === "number")) : new Set()
	} catch {
		return new Set()
	}
}

function persistClaimed(set: Set<number>) {
	try {
		localStorage.setItem(CLAIM_KEY, JSON.stringify([...set]))
	} catch {
		// ignore
	}
}

interface Props {
	open: boolean
	onClose: () => void
	streak: StreakData
}

interface Milestone {
	days: number
	coins: number
	icon: "coin" | "chest"
}

const MILESTONES: readonly Milestone[] = [
	{ days: 7, coins: 100, icon: "coin" },
	{ days: 14, coins: 250, icon: "coin" },
	{ days: 30, coins: 500, icon: "chest" },
] as const

export function StreakDialog({ open, onClose, streak }: Props) {
	const [claimed, setClaimed] = useState<Set<number>>(() => loadClaimed())

	useEffect(() => {
		if (!open) return
		setClaimed(loadClaimed())
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [open, onClose])

	const [burstDays, setBurstDays] = useState<number | null>(null)

	function handleClaim(m: Milestone) {
		if (claimed.has(m.days)) return
		const next = new Set(claimed)
		next.add(m.days)
		setClaimed(next)
		persistClaimed(next)

		if (m.icon === "chest") {
			// Mốc lớn → reuse welcome-gift popup (chest mở + coin burst + count up).
			onClose()
			setTimeout(() => useWelcomeGift.getState().show(m.coins, "streak-30"), 240)
			return
		}

		// Mốc nhỏ → toast + burst particles trên row + coin-gain trên header.
		setBurstDays(m.days)
		setTimeout(() => setBurstDays(null), 1200)
		useToast.getState().add(`+${m.coins} xu — phần thưởng mốc ${m.days} ngày!`, "success")
		setTimeout(() => useCoinGain.getState().trigger(m.coins), 220)
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

				<ScrollArea className="max-h-[88vh]">
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
									{done}/{goal} đề thi thử
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
									: `Còn ${remaining} đề thi thử nữa để giữ streak`}
							</p>
						</div>

						<div className="space-y-2">
							<p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-subtle">
								<span className="size-1.5 rounded-full bg-primary" />
								Mốc phần thưởng
							</p>
							<div className="space-y-2">
								{MILESTONES.map((m) => (
									<MilestoneRow
										key={m.days}
										milestone={m}
										streak={currentStreak}
										isClaimed={claimed.has(m.days)}
										isBursting={burstDays === m.days}
										onClaim={() => handleClaim(m)}
									/>
								))}
							</div>
						</div>

						<div className="rounded-(--radius-card) border-2 border-dashed border-border bg-background p-4 space-y-2">
							<p className="text-xs font-bold uppercase tracking-wider text-subtle">Cách tham gia</p>
							<ol className="space-y-1.5 text-xs text-foreground">
								{[
									`Hoàn thành ít nhất ${goal} đề thi thử mỗi ngày`,
									"Không bỏ ngày nào để giữ streak",
									...MILESTONES.map((m) => `Đạt mốc ${m.days} ngày → nhận ${m.coins} xu`),
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
	isClaimed,
	isBursting,
	onClaim,
}: {
	milestone: Milestone
	streak: number
	isClaimed: boolean
	isBursting: boolean
	onClaim: () => void
}) {
	const progress = Math.min(milestone.days, streak)
	const pct = Math.round((progress / milestone.days) * 100)
	const reached = streak >= milestone.days
	const canClaim = reached && !isClaimed

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
						milestone.icon === "chest" ? (
							<StaticIcon name="chest-open" size="sm" />
						) : (
							<Icon name="check" size="sm" className="text-primary-dark" />
						)
					) : (
						<StaticIcon
							name={milestone.icon === "chest" ? "chest" : "coin"}
							size={milestone.icon === "chest" ? "sm" : "xs"}
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
							className="btn btn-primary text-xs px-3 py-1.5 leading-none"
						>
							Nhận xu
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
