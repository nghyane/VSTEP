import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { PaginatedTransactions, PromoRedeemResult, TopupOrder, TopupPackage, WalletBalance } from "@/features/wallet/types";

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

export function useCreateTopup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: { packageId: string; paymentProvider?: string }) =>
      api.post<TopupOrder>("/api/v1/wallet/topup", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

export function useConfirmTopup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) =>
      api.post<TopupOrder>(`/api/v1/wallet/topup/${orderId}/confirm`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
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
