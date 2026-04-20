// Wallet queries — server-side coin balance (aligned with frontend-v3 wallet/queries.ts)
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ApiResponse, api } from "@/lib/api";

export interface WalletBalance {
  balance: number;
  last_transaction_at: string | null;
}

export interface TopupPackage {
  id: string;
  coins: number;
  price_vnd: number;
  label: string;
  is_popular: boolean;
}

export const walletBalanceQuery = queryOptions({
  queryKey: ["wallet", "balance"],
  queryFn: () => api.get<ApiResponse<WalletBalance>>("wallet/balance"),
  staleTime: 30_000,
});

export const topupPackagesQuery = queryOptions({
  queryKey: ["wallet", "topup-packages"],
  queryFn: () => api.get<ApiResponse<TopupPackage[]>>("wallet/topup-packages"),
  staleTime: 300_000,
});

/** Hook: current coin balance (0 if not loaded) */
export function useWalletBalance(): number {
  const { data } = useQuery(walletBalanceQuery);
  return data?.data.balance ?? 0;
}

/** Hook: invalidate balance after spend/topup */
export function useInvalidateWallet() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["wallet"] });
}

/** Topup: create order + confirm (mock) */
export async function topup(packageId: string): Promise<void> {
  const { data: order } = await api.post<ApiResponse<{ id: string }>>("wallet/topup", { package_id: packageId });
  await api.post(`wallet/topup/${order.id}/confirm`);
}

/** Redeem promo code */
export async function redeemPromo(code: string): Promise<{ coins_granted: number; balance_after: number }> {
  const { data } = await api.post<ApiResponse<{ coins_granted: number; balance_after: number }>>("wallet/promo-redeem", { code });
  return data;
}
