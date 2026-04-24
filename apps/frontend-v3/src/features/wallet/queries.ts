import { queryOptions } from "@tanstack/react-query"
import type { TopupPackage, WalletBalance } from "#/features/wallet/types"
import { type ApiResponse, api } from "#/lib/api"

export const walletBalanceQuery = queryOptions({
	queryKey: ["wallet", "balance"],
	queryFn: () => api.get("wallet/balance").json<ApiResponse<WalletBalance>>(),
})

export const topupPackagesQuery = queryOptions({
	queryKey: ["wallet", "topup-packages"],
	queryFn: () => api.get("wallet/topup-packages").json<ApiResponse<TopupPackage[]>>(),
	staleTime: 5 * 60 * 1000,
})
