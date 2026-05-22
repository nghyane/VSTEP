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

// ─── Profile / onboarding levels ──────────────────────────────────────────────
// Shared constants giữa onboarding (RegisterForm) và create-profile flow.

export const TARGET_LEVELS = ["B1", "B2", "C1"] as const
export type TargetLevel = (typeof TARGET_LEVELS)[number]

export const ENTRY_LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const
export type EntryLevel = (typeof ENTRY_LEVELS)[number]

export const LEVEL_RANK: Record<EntryLevel, number> = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4 }

/** Min months giữa hôm nay và ngày thi, theo độ chênh entry → target. */
export const MIN_PREP_MONTHS = [1, 3, 6, 12, 18] as const

export const TARGET_LEVEL_INFO: Record<TargetLevel, string> = {
	B1: "Giao tiếp cơ bản",
	B2: "Phổ biến nhất",
	C1: "Nâng cao",
}

/** Tính ISO date tối thiểu (YYYY-MM-DD) phù hợp với gap entry → target. */
export function computeMinDate(entry: EntryLevel, target: TargetLevel): string {
	const gap = LEVEL_RANK[target] - LEVEL_RANK[entry]
	const months = MIN_PREP_MONTHS[Math.max(0, gap)] ?? MIN_PREP_MONTHS[MIN_PREP_MONTHS.length - 1]
	const d = new Date()
	d.setMonth(d.getMonth() + months)
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Số tháng tối thiểu để chuẩn bị từ entry → target. */
export function minPrepMonths(entry: EntryLevel, target: TargetLevel): number {
	const gap = Math.max(0, LEVEL_RANK[target] - LEVEL_RANK[entry])
	return MIN_PREP_MONTHS[gap] ?? MIN_PREP_MONTHS[MIN_PREP_MONTHS.length - 1]
}

/** Lọc target levels khả dụng theo entry rank (target ≥ entry). */
export function availableTargets(entry: EntryLevel): readonly TargetLevel[] {
	const minRank = LEVEL_RANK[entry]
	return TARGET_LEVELS.filter((l) => LEVEL_RANK[l] >= minRank)
}
