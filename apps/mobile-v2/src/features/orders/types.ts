export type OrderHistoryType = "topup" | "course";

export type OrderHistoryStatus = "pending" | "paid" | "failed" | "cancelled" | "expired";

export interface OrderHistoryItem {
  id: string;
  type: OrderHistoryType;
  typeLabel: string;
  status: OrderHistoryStatus;
  amountVnd: number;
  paymentProvider: string;
  orderCode: number | null;
  itemName: string;
  coinsToCredit: number | null;
  createdAt: string;
}

export interface OrderHistoryResponse {
  data: OrderHistoryItem[];
  meta: {
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
}
