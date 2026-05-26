import { useQuery } from "@tanstack/react-query"
import { topupPackagesQuery, walletBalanceQuery } from "#/features/wallet/queries"
import type { TopupPackage } from "#/features/wallet/types"

export interface EnrichedPackage extends TopupPackage {
	pricePerCoin: number
	savingsPct: number
}

interface UseTopupDialogResult {
	packages: EnrichedPackage[]
	balance: number
	isLoading: boolean
}

export function useTopupDialog(): UseTopupDialogResult {
	const { data, isLoading } = useQuery(topupPackagesQuery)
	const { data: walletData } = useQuery(walletBalanceQuery)

	const raw = data?.data ?? []
	const balance = walletData?.data.balance ?? 0

	if (raw.length === 0) {
		return { packages: [], balance, isLoading }
	}

	// Base price per coin = from the no-bonus package (Gói khởi đầu).
	const basePkg = raw.find((p) => p.bonus_coins === 0) ?? raw[0]
	const basePricePerCoin = Math.round(basePkg.amount_vnd / basePkg.total_coins)

	const enriched = raw.map((p) => {
		const pricePerCoin = Math.round(p.amount_vnd / p.total_coins)
		const savingsPct =
			p.bonus_coins > 0
				? Math.max(0, Math.round(((basePricePerCoin - pricePerCoin) / basePricePerCoin) * 100))
				: 0
		return { ...p, pricePerCoin, savingsPct }
	})

	return { packages: enriched, balance, isLoading }
}
