import { BAND_THRESHOLDS } from "./constants";

export type SubmissionBand = "B1" | "B2" | "C1" | null;

/**
 * Map a 0-10 score to VSTEP.3-5 proficiency bands.
 * Scores below 4.0 are treated as below B1 and return null.
 */
export function scoreToBand(score: number): SubmissionBand {
  if (score < 0) return null;
  if (score >= BAND_THRESHOLDS.C1) return "C1";
  if (score >= BAND_THRESHOLDS.B2) return "B2";
  if (score >= BAND_THRESHOLDS.B1) return "B1";
  return null;
}
