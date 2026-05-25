// Welcome Gift store — shows coin reward modal after register/onboarding
import { useSyncExternalStore } from "react";

export type GiftKind = "welcome" | "streak-chest";

interface GiftState {
  amount: number | null;
  kind: GiftKind;
  streakDays: number | null;
}

let state: GiftState = { amount: null, kind: "welcome", streakDays: null };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function showWelcomeGift(amount: number, kind: GiftKind = "welcome", streakDays: number | null = null) {
  state = { amount, kind, streakDays };
  notify();
}

export function dismissWelcomeGift() {
  state = { amount: null, kind: "welcome", streakDays: null };
  notify();
}

export function useWelcomeGift() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => state,
  );
}
