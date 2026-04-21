import { queryOptions } from "@tanstack/react-query"
import { type ApiResponse, api } from "#/lib/api"
import type { WalletBalance } from "#/features/wallet/types"

export const walletBalanceQuery = queryOptions({
	queryKey: ["wallet", "balance"],
	queryFn: () => api.get("wallet/balance").json<ApiResponse<WalletBalance>>(),
})
