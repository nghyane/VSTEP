import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { Icon, StaticIcon } from "#/components/Icon"
import { ProfileDropdown } from "#/components/ProfileDropdown"
import { streakQuery } from "#/features/dashboard/queries"
import { StreakDialog } from "#/features/dashboard/StreakDialog"
import { unreadCountQuery } from "#/features/notifications/queries"
import { walletBalanceQuery } from "#/features/wallet/queries"
import { TopUpDialog } from "#/features/wallet/TopUpDialog"
import { useSession } from "#/lib/auth"
import { useCoinGain } from "#/lib/coin-gain"
import { cn, formatNumber } from "#/lib/utils"

interface Props {
	title: string
	backTo?: string
}

export function Header({ title, backTo }: Props) {
	const { profile } = useSession()
	const { data: walletData } = useQuery(walletBalanceQuery)
	const { data: streakData } = useQuery(streakQuery)
	const { data: unreadData } = useQuery(unreadCountQuery)

	const balance = walletData ? walletData.data.balance : null
	const streakInfo = streakData?.data ?? null
	const streak = streakInfo ? streakInfo.current_streak : null
	const unread = unreadData ? unreadData.data.count : 0
	const initial = profile.nickname.charAt(0).toUpperCase()
	const [topupOpen, setTopupOpen] = useState(false)
	const [streakOpen, setStreakOpen] = useState(false)

	const pulse = useCoinGain((s) => s.pulse)
	const gainAmount = useCoinGain((s) => s.amount)
	const lastPulseRef = useRef(pulse)
	const [animKey, setAnimKey] = useState(0)
	useEffect(() => {
		if (pulse === lastPulseRef.current) return
		lastPulseRef.current = pulse
		setAnimKey((k) => k + 1)
		const t = setTimeout(() => setAnimKey(0), 1600)
		return () => clearTimeout(t)
	}, [pulse])

	return (
		<div className="sticky top-0 z-10 bg-background px-10 pt-8 pb-5 flex items-center justify-between">
			<div className="flex items-center gap-1">
				{backTo && (
					<Link to={backTo} className="p-1 -ml-2 hover:opacity-70 transition">
						<Icon name="back" size="sm" className="text-muted" />
					</Link>
				)}
				<h2 className="font-extrabold text-2xl text-foreground">{title}</h2>
			</div>
			<div className="flex items-center gap-3 shrink-0">
				<div className="relative shrink-0">
					<button
						type="button"
						onClick={() => setTopupOpen(true)}
						aria-label={`${balance ?? 0} xu — bấm để nạp thêm`}
						className="group inline-flex w-max items-center gap-2 px-3 py-1.5 rounded-full bg-coin-tint border-2 border-coin/40 border-b-4 hover:bg-coin/25 hover:-translate-y-0.5 active:translate-y-0 active:border-b-2 transition-all whitespace-nowrap"
					>
						<StaticIcon
							name="coin"
							size="sm"
							className={cn(
								"origin-center group-hover:animate-[coinPinch_600ms_ease-in-out]",
								animKey > 0 && "animate-[coinPinch_700ms_ease-in-out]",
							)}
						/>
						<span className="font-extrabold text-base text-coin-dark tabular-nums leading-none">
							{balance !== null ? balance.toLocaleString("vi-VN") : "–"}
						</span>
						<span
							aria-hidden
							className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-coin/30 text-coin-dark font-extrabold text-xs leading-none opacity-60 group-hover:opacity-100 group-hover:bg-coin/50 transition"
						>
							+
						</span>
					</button>
					{animKey > 0 && (
						<>
							<span
								key={`ring-${animKey}`}
								aria-hidden
								className="pointer-events-none absolute inset-0 rounded-full bg-coin/40 animate-[coinPulseRing_900ms_ease-out_forwards]"
							/>
							<span
								key={`fly-${animKey}`}
								aria-hidden
								className="pointer-events-none absolute left-1/2 top-0 inline-flex w-max items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-coin text-coin-dark font-extrabold text-sm tabular-nums shadow-md whitespace-nowrap animate-[coinFlyUp_1300ms_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
							>
								<StaticIcon name="coin" size="xs" className="h-4 w-auto shrink-0" />
								<span className="leading-none">+{formatNumber(gainAmount)}</span>
							</span>
						</>
					)}
				</div>
				<button
					type="button"
					onClick={() => setStreakOpen(true)}
					disabled={streakInfo === null}
					aria-label={`Streak ${streak ?? 0} ngày — bấm để xem chi tiết`}
					className="inline-flex shrink-0 items-center gap-2 px-3 py-1.5 rounded-full bg-streak-tint border-2 border-streak/30 border-b-4 whitespace-nowrap hover:bg-streak/15 hover:-translate-y-0.5 active:translate-y-0 active:border-b-2 transition-all disabled:cursor-default disabled:hover:translate-y-0"
				>
					<StaticIcon name="streak-sm" size="sm" />
					<span className="font-extrabold text-base text-streak tabular-nums leading-none">
						{streak !== null ? streak : "–"}
					</span>
				</button>
				<ProfileDropdown unread={unread} initial={initial} />
			</div>
			<TopUpDialog open={topupOpen} onClose={() => setTopupOpen(false)} />
			{streakInfo && (
				<StreakDialog open={streakOpen} onClose={() => setStreakOpen(false)} streak={streakInfo} />
			)}
		</div>
	)
}
