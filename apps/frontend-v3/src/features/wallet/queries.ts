import { queryOptions } from "@tanstack/react-query"
import { type ApiResponse, api } from "#/lib/api"

export interface WalletBalance {
	balance: number
	last_transaction_at: string | null
}

export const walletBalanceQuery = queryOptions({
	queryKey: ["wallet", "balance"],
	queryFn: () => api.get("wallet/balance").json<ApiResponse<WalletBalance>>(),
})
