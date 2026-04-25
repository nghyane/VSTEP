/** VSTEP level → minimum band score to pass */
export const levelToBand: Record<string, number> = {
	A2: 3.5,
	B1: 4.0,
	B2: 6.0,
	C1: 8.5,
}

export function getTargetBand(targetLevel: string): number {
	return levelToBand[targetLevel] ?? 6.0
}

/** Heatmap intensity thresholds (số bài exam mỗi ngày) — 1 / 2 / 3 / 4+ */
export const heatmapLevels = [1, 2, 3, 4] as const
