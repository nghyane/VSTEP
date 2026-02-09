export type SubmissionBand = "B1" | "B2" | "C1" | null;

/**
 * Map a 0-10 score to VSTEP.3-5 proficiency bands.
 * Scores below 4.0 are treated as below B1 and return null.
 */
export function scoreToBand(score: number): SubmissionBand {
  if (score < 0) return null;
  if (score >= 8.5) return "C1";
  if (score >= 6.0) return "B2";
  if (score >= 4.0) return "B1";
  return null;
}
