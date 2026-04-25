// Coin store — local cache backed by wallet API
import { useSyncExternalStore } from "react";
import { api } from "@/lib/api";
export const FULL_TEST_COST = 100;

let coins = 500;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export async function loadCoins() {
  try {
    const res = await api.get<{ balance: number } | null>("/api/v1/wallet/balance");
    if (res?.balance !== undefined) {
      coins = res.balance;
      notify();
    }
  } catch {
    // API not available yet — keep default
  }
}

export function syncCoins(balance: number) {
  if (coins !== balance) {
    coins = balance;
    notify();
  }
}

export function addCoins(amount: number) {
  coins = Math.max(0, coins + amount);
  notify();
}

export function spendCoins(amount: number): boolean {
  if (coins < amount) return false;
  coins -= amount;
  notify();
  return true;
}

export function useCoins() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => coins,
  );
}
