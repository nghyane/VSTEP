import { useQuery } from "@tanstack/react-query"
import gemIcon from "#/assets/icons/gem-small.svg"
import streakIcon from "#/assets/icons/streak-small.svg"
import { useAuth } from "#/features/auth/AuthProvider"
import { streakQuery } from "#/features/dashboard/queries"
import { walletBalanceQuery } from "#/features/wallet/queries"

interface Props {
	title: string
}

export function Header({ title }: Props) {
	const { profile } = useAuth()
	const { data: walletData } = useQuery(walletBalanceQuery)
	const { data: streakData } = useQuery(streakQuery)

	const balance = walletData?.data.balance ?? 0
	const streak = streakData?.data.current_streak ?? 0
	const initial = profile?.nickname?.charAt(0).toUpperCase() ?? "?"

	return (
		<div className="sticky top-0 z-10 bg-background px-10 pt-8 pb-5 flex items-center justify-between">
			<h2 className="font-extrabold text-2xl text-foreground">{title}</h2>

			<div className="flex items-center gap-6">
				<div className="flex items-center gap-2">
					<img src={gemIcon} className="h-7 w-auto" alt="Xu" />
					<span className="font-bold text-base text-coin-dark">{balance}</span>
				</div>
				<div className="flex items-center gap-2">
					<img src={streakIcon} className="h-7 w-auto" alt="Streak" />
					<span className="font-bold text-base text-streak">{streak}</span>
				</div>
				<button
					type="button"
					className="relative w-10 h-10 rounded-full bg-primary text-primary-foreground font-display text-base flex items-center justify-center hover:ring-2 hover:ring-primary/40 transition"
				>
					{initial}
					<span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-destructive border-2 border-background" />
				</button>
			</div>
		</div>
	)
}
