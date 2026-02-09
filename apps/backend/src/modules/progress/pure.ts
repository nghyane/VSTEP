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
  if (scores.length >= 6 && stdDev !== null) {
    if (stdDev >= 1.5) return "inconsistent";
    const recent3 = scores.slice(0, 3);
    const prev3 = scores.slice(3, 6);
    const avgRecent = recent3.reduce((a, b) => a + b, 0) / 3;
    const avgPrev = prev3.reduce((a, b) => a + b, 0) / 3;
    const delta = avgRecent - avgPrev;
    if (delta >= 0.5) return "improving";
    if (delta <= -0.5) return "declining";
    return "stable";
  }
  if (scores.length >= 3) {
    return stdDev !== null && stdDev >= 1.5 ? "inconsistent" : "stable";
  }
  return "insufficient_data";
}
