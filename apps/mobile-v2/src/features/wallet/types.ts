export interface WalletBalance {
  balance: number;
  lastTransactionAt: string | null;
}

export interface TopupPackage {
  id: string;
  label: string;
  amountVnd: number;
  coinsBase: number;
  bonusCoins: number;
  totalCoins: number;
  displayOrder: number;
}

export interface TopupOrder {
  id: string;
  profileId: string;
  packageId: string;
  amountVnd: number;
  coinsToCredit: number;
  status: "pending" | "paid" | "failed" | "cancelled";
  paymentProvider: string;
  providerRef: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface CoinTransaction {
  id: string;
  type: string;
  delta: number;
  balanceAfter: number;
  sourceType: string;
  sourceId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaginatedTransactions {
  data: CoinTransaction[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PromoRedeemResult {
  coinsGranted: number;
  balanceAfter: number;
  transactionId: string;
  redeemedAt: string;
}
