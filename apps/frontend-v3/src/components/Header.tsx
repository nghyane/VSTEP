import { useQuery } from "@tanstack/react-query"
import { StaticIcon } from "#/components/Icon"
import { ProfileDropdown } from "#/components/ProfileDropdown"
import { streakQuery } from "#/features/dashboard/queries"
import { unreadCountQuery } from "#/features/notifications/queries"
import { walletBalanceQuery } from "#/features/wallet/queries"
import { useSession } from "#/lib/auth"

interface Props {
	title: string
}

export function Header({ title }: Props) {
	const { profile } = useSession()
	const { data: walletData } = useQuery(walletBalanceQuery)
	const { data: streakData } = useQuery(streakQuery)
	const { data: unreadData } = useQuery(unreadCountQuery)

	const balance = walletData ? walletData.data.balance : null
	const streak = streakData ? streakData.data.current_streak : null
	const unread = unreadData ? unreadData.data.count : 0
	const initial = profile.nickname.charAt(0).toUpperCase()

	return (
		<div className="sticky top-0 z-10 bg-background px-10 pt-8 pb-5 flex items-center justify-between">
			<h2 className="font-extrabold text-2xl text-foreground">{title}</h2>
			<div className="flex items-center gap-6">
				<div className="flex items-center gap-2">
					<StaticIcon name="gem-color" size="sm" />
					<span className="font-bold text-base text-coin-dark">{balance !== null ? balance : "–"}</span>
				</div>
				<div className="flex items-center gap-2">
					<StaticIcon name="streak-sm" size="sm" />
					<span className="font-bold text-base text-streak">{streak !== null ? streak : "–"}</span>
				</div>
				<ProfileDropdown unread={unread} initial={initial} />
			</div>
		</div>
	)
}
