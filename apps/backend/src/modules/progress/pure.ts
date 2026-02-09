import { TREND_THRESHOLDS } from "@common/constants";

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
    const recent3 = scores.slice(0, 3);
    const prev3 = scores.slice(3, 6);
    const avgRecent = recent3.reduce((a, b) => a + b, 0) / 3;
    const avgPrev = prev3.reduce((a, b) => a + b, 0) / 3;
    const delta = avgRecent - avgPrev;
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
