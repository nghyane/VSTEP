import { queryOptions } from "@tanstack/react-query"
import type { WalletBalance } from "#/features/wallet/types"
import { type ApiResponse, api } from "#/lib/api"

export const walletBalanceQuery = queryOptions({
	queryKey: ["wallet", "balance"],
	queryFn: () => api.get("wallet/balance").json<ApiResponse<WalletBalance>>(),
})
