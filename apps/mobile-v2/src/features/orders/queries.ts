import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { OrderHistoryResponse } from "@/features/orders/types";

export function useOrderHistory(page: number) {
  return useQuery({
    queryKey: ["orders", "history", page] as const,
    queryFn: () => api.get<OrderHistoryResponse>(`/api/v1/me/orders?page=${page}`),
  });
}
