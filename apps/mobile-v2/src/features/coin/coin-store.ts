// Coin store — in-memory, initialized on app launch
import { useSyncExternalStore } from "react";
export const FULL_TEST_COST = 100;

let coins = 500;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export async function loadCoins() {
  // Khởi tạo mặc định — không notify() vì coins đã = 500 khi khai báo
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
