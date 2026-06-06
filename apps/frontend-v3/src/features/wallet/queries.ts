import { queryOptions } from "@tanstack/react-query"
import type { CoinTransaction, TopupPackage, WalletBalance } from "#/features/wallet/types"
import { type ApiResponse, api, type PaginatedResponse } from "#/lib/api"

export const walletBalanceQuery = queryOptions({
	queryKey: ["wallet", "balance"],
	queryFn: () => api.get("wallet/balance").json<ApiResponse<WalletBalance>>(),
})

export const topupPackagesQuery = queryOptions({
	queryKey: ["wallet", "topup-packages"],
	queryFn: () => api.get("wallet/topup-packages").json<ApiResponse<TopupPackage[]>>(),
	staleTime: 5 * 60 * 1000,
})

export function walletTransactionsQuery(page: number) {
	return queryOptions({
		queryKey: ["wallet", "transactions", page],
		queryFn: () =>
			api
				.get("wallet/transactions", { searchParams: { page, per_page: 15 } })
				.json<PaginatedResponse<CoinTransaction>>(),
	})
}
