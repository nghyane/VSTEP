// Streak store — backend-backed full-test streak + milestone rewards
import { useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import { syncCoins } from "@/features/coin/coin-store";

export interface StreakMilestone {
  days: number;
  coins: number;
  claimed: boolean;
  claimedAt: string | null;
}

interface StreakState {
  todayProgress: number;
  dailyGoal: number;
  milestones: StreakMilestone[];
}

interface StreakResponse {
  todaySessions: number;
  dailyGoal: number;
  milestones?: StreakMilestone[];
}

interface ClaimMilestoneResponse {
  milestoneDays: number;
  coinsGranted: number;
  balanceAfter: number;
  claimedAt: string;
}

const DEFAULT_MILESTONES: StreakMilestone[] = [
  { days: 3, coins: 50, claimed: false, claimedAt: null },
  { days: 7, coins: 150, claimed: false, claimedAt: null },
  { days: 14, coins: 300, claimed: false, claimedAt: null },
  { days: 30, coins: 700, claimed: false, claimedAt: null },
];

let state: StreakState = {
  todayProgress: 0,
  dailyGoal: 1,
  milestones: DEFAULT_MILESTONES,
};
let claimedSet: ReadonlySet<number> = new Set();

const listeners = new Set<() => void>();

function notify() { listeners.forEach((l) => l()); }

function setState(next: StreakState) {
  state = next;
  claimedSet = new Set(next.milestones.filter((m) => m.claimed).map((m) => m.days));
  notify();
}

export function getDailyGoal() {
  return state.dailyGoal;
}

export function getStreakMilestones() {
  return state.milestones;
}

export async function loadStreakData() {
  try {
    const res = await api.get<StreakResponse>("/api/v1/streak");
    setState({
      todayProgress: res.todaySessions,
      dailyGoal: res.dailyGoal,
      milestones: res.milestones ?? DEFAULT_MILESTONES,
    });
  } catch {
    // Keep cached/default streak state when API is unavailable.
  }
}

export function incrementTodayProgress() {
  state = { ...state, todayProgress: state.todayProgress + 1 };
  notify();
}

export async function claimMilestone(days: number) {
  const res = await api.post<ClaimMilestoneResponse>(`/api/v1/streak/milestones/${days}/claim`);
  syncCoins(res.balanceAfter);
  setState({
    ...state,
    milestones: state.milestones.map((m) =>
      m.days === res.milestoneDays ? { ...m, claimed: true, claimedAt: res.claimedAt } : m,
    ),
  });
}

export function useTodayProgress() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state.todayProgress,
  );
}

export function useDailyGoal() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state.dailyGoal,
  );
}

export function useStreakMilestones() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state.milestones,
  );
}

export function useClaimedMilestones(): ReadonlySet<number> {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => claimedSet,
  );
}
