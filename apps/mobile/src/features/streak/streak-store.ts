// Streak store — daily goal + milestones (aligned with frontend-v2 streak-rewards.ts)
// SecureStore persist, event emitter for hooks
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { refundCoins } from "@/features/coin/coin-store";
import { pushNotification } from "@/features/notification/notification-store";

export interface StreakMilestone { days: number; coins: number }

export const STREAK_MILESTONES: readonly StreakMilestone[] = [
  { days: 7, coins: 100 },
  { days: 14, coins: 250 },
  { days: 30, coins: 500 },
];

export const DAILY_GOAL = 3;

// ─── Claimed milestones ──────────────────────────────────────────
const CLAIMED_KEY = "vstep:streak-claimed:v1";
let claimed = new Set<number>();
const claimedListeners = new Set<() => void>();

function emitClaimed() {
  SecureStore.setItemAsync(CLAIMED_KEY, JSON.stringify([...claimed])).catch(() => {});
  for (const fn of claimedListeners) fn();
}

export async function loadStreakData(): Promise<void> {
  try {
    const raw = await SecureStore.getItemAsync(CLAIMED_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) claimed = new Set(arr.filter((n): n is number => typeof n === "number"));
    }
  } catch {}
  try {
    const raw = await SecureStore.getItemAsync(PROGRESS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p?.date === todayKey() && typeof p.count === "number") progress = p;
      else progress = { date: todayKey(), count: 0 };
    }
  } catch {}
}

export function useClaimedMilestones(): ReadonlySet<number> {
  const [val, setVal] = useState<ReadonlySet<number>>(claimed);
  useEffect(() => {
    const fn = () => setVal(new Set(claimed));
    claimedListeners.add(fn);
    return () => { claimedListeners.delete(fn); };
  }, []);
  return val;
}

export function claimMilestone(days: number): boolean {
  const m = STREAK_MILESTONES.find((ms) => ms.days === days);
  if (!m || claimed.has(days)) return false;
  claimed.add(days);
  emitClaimed();
  refundCoins(m.coins);
  pushNotification({
    id: `streak:claimed:${days}`,
    title: `+${m.coins} xu từ mốc ${days} ngày`,
    body: "Chúc mừng bạn đã nhận thưởng streak!",
    iconKey: "coin",
  });
  return true;
}

// ─── Today progress ──────────────────────────────────────────────
const PROGRESS_KEY = "vstep:streak-progress:v1";

interface ProgressState { date: string; count: number }

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

let progress: ProgressState = { date: todayKey(), count: 0 };
const progressListeners = new Set<() => void>();

function emitProgress() {
  SecureStore.setItemAsync(PROGRESS_KEY, JSON.stringify(progress)).catch(() => {});
  for (const fn of progressListeners) fn();
}

export function useTodayProgress(): number {
  const [val, setVal] = useState(progress.date === todayKey() ? progress.count : 0);
  useEffect(() => {
    const fn = () => setVal(progress.date === todayKey() ? progress.count : 0);
    progressListeners.add(fn);
    return () => { progressListeners.delete(fn); };
  }, []);
  return val;
}

/** Record 1 exam completion. Returns true if daily goal just reached. */
export function recordExamCompletion(): boolean {
  const today = todayKey();
  const was = progress.date === today ? progress.count : 0;
  progress = { date: today, count: was + 1 };
  emitProgress();
  const reachedGoal = was < DAILY_GOAL && progress.count >= DAILY_GOAL;
  if (reachedGoal) {
    pushNotification({
      id: `streak:goal:${today}`,
      title: `Đã giữ streak hôm nay (${DAILY_GOAL}/${DAILY_GOAL} đề thi)`,
      body: "Quay lại mai để nâng chuỗi học lên một ngày nữa!",
      iconKey: "fire",
    });
  }
  return reachedGoal;
}
