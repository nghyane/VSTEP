// Streak store — daily goal tracking + milestone rewards
// getSnapshot phải trả stable reference — không tạo object mới mỗi lần gọi
import { useSyncExternalStore } from "react";

export const DAILY_GOAL = 1;
export const STREAK_MILESTONES = [
  { days: 3, coins: 50 },
  { days: 7, coins: 150 },
  { days: 14, coins: 300 },
  { days: 30, coins: 700 },
];

let todayProgress = 0;
let claimedMilestones: number[] = [];
// Cache Set — chỉ tạo lại khi claimedMilestones thay đổi
let claimedSet: ReadonlySet<number> = new Set();

const listeners = new Set<() => void>();

function notify() { listeners.forEach((l) => l()); }

export async function loadStreakData() {
  // Khởi tạo mặc định — không notify() vì không có thay đổi thật
}

export function incrementTodayProgress() {
  todayProgress++;
  notify();
}

export function claimMilestone(days: number) {
  if (!claimedMilestones.includes(days)) {
    claimedMilestones = [...claimedMilestones, days];
    claimedSet = new Set(claimedMilestones); // rebuild cache
    notify();
  }
}

export function useTodayProgress() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => todayProgress,
  );
}

export function useClaimedMilestones(): ReadonlySet<number> {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => claimedSet, // stable reference — chỉ thay đổi khi claimMilestone() gọi
  );
}
