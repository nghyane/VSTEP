import { useQuery } from "@tanstack/react-query"
import { appConfigQuery } from "#/features/config/queries"
import type { AppConfig } from "#/features/config/types"
import { topupPackagesQuery, walletBalanceQuery } from "#/features/wallet/queries"
import type { TopupPackage } from "#/features/wallet/types"

export interface EnrichedPackage extends TopupPackage {
	pricePerCoin: number
	savingsPct: number
}

interface UseTopupDialogResult {
	packages: EnrichedPackage[]
	balance: number
	pricing: AppConfig["pricing"] | null
	isLoading: boolean
}

export function useTopupDialog(): UseTopupDialogResult {
	const { data, isLoading } = useQuery(topupPackagesQuery)
	const { data: walletData } = useQuery(walletBalanceQuery)
	const { data: configData, isLoading: isConfigLoading } = useQuery(appConfigQuery)

	const raw = data?.data ?? []
	const balance = walletData?.data.balance ?? 0
	const pricing = configData?.data.pricing ?? null

	if (raw.length === 0) {
		return { packages: [], balance, pricing, isLoading: isLoading || isConfigLoading }
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

	return { packages: enriched, balance, pricing, isLoading: isLoading || isConfigLoading }
}
