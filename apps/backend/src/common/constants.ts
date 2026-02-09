// ── Pagination ──────────────────────────────────────────────────────
export const MAX_PAGE_SIZE = 100;

// ── Scoring (VSTEP.3-5) ────────────────────────────────────────────
/** Score thresholds for VSTEP band mapping (0-10 scale) */
export const BAND_THRESHOLDS = {
  C1: 8.5,
  B2: 6.0,
  B1: 4.0,
} as const;

// ── Trend Analysis ─────────────────────────────────────────────────
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

// ── Password Hashing (Argon2id) ────────────────────────────────────
export const ARGON2_CONFIG = {
  algorithm: "argon2id" as const,
  memoryCost: 65536,
  timeCost: 3,
};

// ── Auth ────────────────────────────────────────────────────────────
export const MAX_REFRESH_TOKENS_PER_USER = 3;
