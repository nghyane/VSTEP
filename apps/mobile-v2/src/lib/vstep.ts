/** VSTEP level → minimum band score to pass */
export const levelToBand: Record<string, number> = {
  A2: 3.5,
  B1: 4.0,
  B2: 6.0,
  C1: 8.5,
};

export function getTargetBand(targetLevel: string): number {
  return levelToBand[targetLevel] ?? 6.0;
}

/** Heatmap intensity thresholds (minutes per day) */
export const heatmapLevels = [5, 15, 25, 35] as const;
