// Streak store — backend-backed learner activity streak + milestone rewards
import { useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import { syncWalletBalanceCache } from "@/features/wallet/queries";

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
  current: number;
  longest: number;
  todayActive: boolean;
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

const listeners = new Set<() => void>();

function notify() { listeners.forEach((l) => l()); }

function setState(next: StreakState) {
  state = next;
  notify();
}

export async function loadStreakData() {
  try {
    const res = await api.get<StreakResponse>("/api/v1/streak");
    setState({
      todayProgress: res.todayActive ? res.dailyGoal : 0,
      dailyGoal: res.dailyGoal,
      milestones: res.milestones ?? DEFAULT_MILESTONES,
    });
  } catch {
    // Keep cached/default streak state when API is unavailable.
  }
}

export async function claimMilestone(days: number) {
  const res = await api.post<ClaimMilestoneResponse>(`/api/v1/streak/milestones/${days}/claim`);
  syncWalletBalanceCache(queryClient, res.balanceAfter, res.claimedAt);
  void queryClient.invalidateQueries({ queryKey: ["wallet"] });
  void queryClient.invalidateQueries({ queryKey: ["streak"] });
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
