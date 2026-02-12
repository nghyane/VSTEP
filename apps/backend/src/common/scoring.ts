/** Score thresholds for VSTEP band mapping (0-10 scale) */
export const BAND_THRESHOLDS = {
  C1: 8.5,
  B2: 6.0,
  B1: 4.0,
} as const;

export type VstepBand = "B1" | "B2" | "C1" | null;

/**
 * Map a 0-10 score to VSTEP.3-5 proficiency bands.
 * Scores below 4.0 are treated as below B1 and return null.
 */
export function scoreToBand(score: number): VstepBand {
  if (score < 0) return null;
  if (score >= BAND_THRESHOLDS.C1) return "C1";
  if (score >= BAND_THRESHOLDS.B2) return "B2";
  if (score >= BAND_THRESHOLDS.B1) return "B1";
  return null;
}

/** Calculate a skill score: (correct / total) * 10, rounded to nearest 0.5 */
export function calculateScore(correct: number, total: number): number | null {
  return total === 0 ? null : Math.round((correct / total) * 10 * 2) / 2;
}

/**
 * Calculate overall score as the average of all skill scores, rounded to nearest 0.5.
 * Returns null when any required skill score is still missing.
 */
export function calculateOverallScore(
  scores: (number | null)[],
): number | null {
  if (scores.length === 0 || scores.some((s) => s === null)) return null;
  const valid = scores as number[];
  const avg = valid.reduce((sum, s) => sum + s, 0) / valid.length;
  return Math.round(avg * 2) / 2;
}
