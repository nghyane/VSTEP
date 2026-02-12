import { TREND_THRESHOLDS } from "./constants";

/** Compute mean and sample standard deviation from a score window. */
export function computeStats(scores: number[]) {
  if (scores.length === 0) return { avg: null, stdDev: null };

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const stdDev =
    scores.length > 1
      ? Math.sqrt(
          scores.reduce((sum, s) => sum + (s - avg) ** 2, 0) /
            (scores.length - 1),
        )
      : null;

  return { avg, stdDev };
}

export type Trend =
  | "improving"
  | "stable"
  | "declining"
  | "inconsistent"
  | "insufficient_data";

/**
 * Classify trend from recent scores using volatility and a 3-vs-3 average delta.
 * Thresholds: stdDev >= 1.5 => inconsistent, delta >= 0.5 => improving, delta <= -0.5 => declining.
 */
export function computeTrend(scores: number[], stdDev: number | null): Trend {
  if (
    scores.length >= TREND_THRESHOLDS.fullAnalysisMinScores &&
    stdDev !== null
  ) {
    if (stdDev >= TREND_THRESHOLDS.inconsistentStdDev) return "inconsistent";
    const recent = scores.slice(0, 3);
    const prev = scores.slice(3, 6);
    const delta =
      recent.reduce((a, b) => a + b, 0) / 3 -
      prev.reduce((a, b) => a + b, 0) / 3;
    if (delta >= TREND_THRESHOLDS.improvingDelta) return "improving";
    if (delta <= TREND_THRESHOLDS.decliningDelta) return "declining";
    return "stable";
  }
  if (scores.length >= TREND_THRESHOLDS.basicAnalysisMinScores) {
    return stdDev !== null && stdDev >= TREND_THRESHOLDS.inconsistentStdDev
      ? "inconsistent"
      : "stable";
  }
  return "insufficient_data";
}
