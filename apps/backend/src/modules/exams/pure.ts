/** Calculate a skill score with (correct / total) * 10, rounded to nearest 0.5. */
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
