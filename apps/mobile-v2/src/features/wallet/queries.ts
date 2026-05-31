import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { PaginatedTransactions, PromoRedeemResult, TopupPackage, WalletBalance } from "@/features/wallet/types";

export const walletBalanceQuery = {
  queryKey: ["wallet", "balance"] as const,
  queryFn: () => api.get<WalletBalance>("/api/v1/wallet/balance"),
};

export const topupPackagesQuery = {
  queryKey: ["wallet", "topup-packages"] as const,
  queryFn: () => api.get<TopupPackage[]>("/api/v1/wallet/topup-packages"),
  staleTime: 5 * 60 * 1000,
};

export function useWalletBalance() {
  return useQuery(walletBalanceQuery);
}

export function useTopupPackages() {
  return useQuery(topupPackagesQuery);
}

export function useWalletTransactions() {
  return useQuery<PaginatedTransactions>({
    queryKey: ["wallet", "transactions"] as const,
    queryFn: () => api.get<PaginatedTransactions>("/api/v1/wallet/transactions"),
  });
}

export function syncWalletBalanceCache(qc: QueryClient, balance: number, lastTransactionAt: string | null = null) {
  qc.setQueryData<WalletBalance>(walletBalanceQuery.queryKey, (prev) => ({
    balance,
    lastTransactionAt: lastTransactionAt ?? prev?.lastTransactionAt ?? null,
  }));
}

export function useRedeemPromo() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (code: string) =>
      api.post<PromoRedeemResult>("/api/v1/wallet/promo-redeem", { code }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
