// Coin store — xu economy (aligned with frontend-v2 features/coin/lib/coin-store.ts)
// AsyncStorage persist + event emitter for React hooks
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "vstep:coins:v1";
const INITIAL_BALANCE = 100;

export const FULL_TEST_COST = 25;
const COST_PER_SKILL = 8;

let balance: number = INITIAL_BALANCE;
const listeners = new Set<() => void>();

function emit() {
  SecureStore.setItemAsync(STORAGE_KEY, String(balance)).catch(() => {});
  for (const fn of listeners) fn();
}

export async function loadCoins(): Promise<void> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (raw !== null) {
      const parsed = parseInt(raw, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        balance = parsed;
        for (const fn of listeners) fn();
      }
    }
  } catch {}
}

export function getCoins(): number {
  return balance;
}

export function useCoins(): number {
  const [val, setVal] = useState(balance);
  useEffect(() => {
    const fn = () => setVal(balance);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return val;
}

export function spendCoins(amount: number): boolean {
  if (amount <= 0) return true;
  if (balance < amount) return false;
  balance -= amount;
  emit();
  return true;
}

export function refundCoins(amount: number): void {
  if (amount <= 0) return;
  balance += amount;
  emit();
}

/** Dev only — reset balance to initial */
export function resetCoins(): void {
  balance = INITIAL_BALANCE;
  emit();
}

export function computeSessionCost(skillCount: number): number {
  if (skillCount === 0 || skillCount >= 4) return FULL_TEST_COST;
  return Math.min(FULL_TEST_COST, COST_PER_SKILL * skillCount);
}
