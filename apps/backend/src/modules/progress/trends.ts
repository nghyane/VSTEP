import { BAND_THRESHOLDS } from "@common/scoring";

/** Round to 1 decimal place */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Round to 2 decimal places */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Get minimum score threshold for a band. Returns undefined for unknown bands. */
export function bandMinScore(band: string): number | undefined {
  return BAND_THRESHOLDS[band as keyof typeof BAND_THRESHOLDS];
}

/** Map Trend to streak direction for userProgress storage */
export function trendToDirection(trend: Trend): "up" | "down" | "neutral" {
  if (trend === "improving") return "up";
  if (trend === "declining") return "down";
  return "neutral";
}

/** Thresholds for skill trend classification */
export const TREND_THRESHOLDS = {
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
 * Estimate weeks to reach targetScore using linear regression on recent scores.
 * Uses time (days) as X, score as Y — no branch at 6 scores.
 * Returns null if: insufficient data, already met, not improving, or absurd (>52 weeks).
 */
export function computeEta(
  scores: number[],
  timestamps: string[],
  targetScore: number,
): number | null {
  if (scores.length < TREND_THRESHOLDS.basicAnalysisMinScores) return null;
  if (targetScore <= 0) return null;

  const { avg } = computeStats(scores);
  if (avg !== null && avg >= targetScore) return 0;

  // scores/timestamps are newest-first — reverse for chronological order
  const times: number[] = [];
  const values: number[] = [];
  const baseTime = new Date(
    timestamps[timestamps.length - 1] as string,
  ).getTime();

  for (let i = timestamps.length - 1; i >= 0; i--) {
    const daysSinceFirst =
      (new Date(timestamps[i] as string).getTime() - baseTime) /
      (1000 * 60 * 60 * 24);
    times.push(daysSinceFirst);
    values.push(scores[i] as number);
  }

  // Linear regression: slope = cov(x,y) / var(x)
  const n = times.length;
  const sumX = times.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let covXY = 0;
  let varX = 0;
  for (let i = 0; i < n; i++) {
    const dx = (times[i] as number) - meanX;
    covXY += dx * ((values[i] as number) - meanY);
    varX += dx * dx;
  }

  // All attempts on same day (varX ≈ 0), or NaN from invalid timestamps
  if (!Number.isFinite(varX) || varX < 0.001) return null;
  const slope = covXY / varX; // score improvement per day

  if (!Number.isFinite(slope) || slope <= 0.001) return null;

  const gap = targetScore - meanY;
  const etaDays = gap / slope;
  const etaWeeks = Math.ceil(etaDays / 7);

  if (!Number.isFinite(etaWeeks) || etaWeeks > 52) return null;
  return etaWeeks;
}

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
