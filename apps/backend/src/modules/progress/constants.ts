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
