import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { Icon, StaticIcon } from "#/components/Icon"
import { ProfileDropdown } from "#/components/ProfileDropdown"
import { streakQuery } from "#/features/dashboard/queries"
import { unreadCountQuery } from "#/features/notifications/queries"
import { walletBalanceQuery } from "#/features/wallet/queries"
import { TopUpDialog } from "#/features/wallet/TopUpDialog"
import { useSession } from "#/lib/auth"

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
	const streak = streakData ? streakData.data.current_streak : null
	const unread = unreadData ? unreadData.data.count : 0
	const initial = profile.nickname.charAt(0).toUpperCase()
	const [topupOpen, setTopupOpen] = useState(false)

	return (
		<div className="sticky top-0 z-10 bg-background px-10 pt-8 pb-5 flex items-center justify-between">
			<div className="flex items-center gap-3">
				{backTo && (
					<Link to={backTo} className="p-1 -ml-2 hover:opacity-70 transition">
						<Icon name="back" size="sm" className="text-muted" />
					</Link>
				)}
				<h2 className="font-extrabold text-2xl text-foreground">{title}</h2>
			</div>
			<div className="flex items-center gap-6">
				<button
					type="button"
					onClick={() => setTopupOpen(true)}
					aria-label="Nạp xu"
					className="group flex items-center gap-2 cursor-pointer"
				>
					<StaticIcon
						name="coin"
						size="sm"
						className="origin-center group-hover:animate-[coinPinch_600ms_ease-in-out]"
					/>
					<span className="font-bold text-base text-coin-dark">{balance !== null ? balance : "–"}</span>
				</button>
				<div className="flex items-center gap-2">
					<StaticIcon name="streak-sm" size="sm" />
					<span className="font-bold text-base text-streak">{streak !== null ? streak : "–"}</span>
				</div>
				<ProfileDropdown unread={unread} initial={initial} />
			</div>
			<TopUpDialog open={topupOpen} onClose={() => setTopupOpen(false)} />
		</div>
	)
}
