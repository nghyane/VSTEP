/** Thresholds for skill trend classification */
const TREND_THRESHOLDS = {
  /** Standard deviation above this → inconsistent */
  inconsistentStdDev: 1.5,
  /** Score delta above this → improving */
  improvingDelta: 0.5,
  /** Score delta below this → declining */
  decliningDelta: -0.5,
  /** Minimum scores needed for full trend analysis */
  fullAnalysisMinScores: 6,
  /** Minimum scores for basic trend */
  basicAnalysisMinScores: 3,
} as const;

/** Compute mean and sample standard deviation from a score window. */
export function computeStats(scores: number[]) {
  if (scores.length === 0) return { avg: null, deviation: null };

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const deviation =
    scores.length > 1
      ? Math.sqrt(
          scores.reduce((sum, s) => sum + (s - avg) ** 2, 0) /
            (scores.length - 1),
        )
      : null;

  return { avg, deviation };
}

export type Trend =
  | "improving"
  | "stable"
  | "declining"
  | "inconsistent"
  | "insufficient_data";

/**
 * Classify trend from recent scores using volatility and a 3-vs-3 average delta.
 * Thresholds: deviation >= 1.5 => inconsistent, delta >= 0.5 => improving, delta <= -0.5 => declining.
 */
export function computeTrend(
  scores: number[],
  deviation: number | null,
): Trend {
  if (
    scores.length >= TREND_THRESHOLDS.fullAnalysisMinScores &&
    deviation !== null
  ) {
    if (deviation >= TREND_THRESHOLDS.inconsistentStdDev) return "inconsistent";
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
    return deviation !== null &&
      deviation >= TREND_THRESHOLDS.inconsistentStdDev
      ? "inconsistent"
      : "stable";
  }
  return "insufficient_data";
}
