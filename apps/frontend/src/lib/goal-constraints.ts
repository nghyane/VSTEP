import type { VstepBand } from "@/types/api"

export const TARGET_BANDS: VstepBand[] = ["B1", "B2", "C1"]

export const LEVEL_ORDER: Record<string, number> = { A2: 0, B1: 1, B2: 2, C1: 3 }

export const DEADLINES = [
	{ label: "1 tháng", months: 1 },
	{ label: "3 tháng", months: 3 },
	{ label: "6 tháng", months: 6 },
	{ label: "1 năm", months: 12 },
	{ label: "Không giới hạn", months: undefined },
] as const

export const DAILY_TIMES = [
	{ label: "15 phút", minutes: 15 },
	{ label: "30 phút", minutes: 30 },
	{ label: "1 giờ", minutes: 60 },
	{ label: "2 giờ", minutes: 120 },
	{ label: "Tuỳ tôi", minutes: undefined },
] as const

export interface GoalConstraints {
	minDeadlineMonths: number
	minDailyMinutes: number
	hint: string | null
}

/**
 * Compute realistic deadline & daily-time constraints based on level gap.
 * Each level jump requires ~3 months at 30 min/day minimum.
 * "Không giới hạn" and "Tuỳ tôi" are always allowed.
 */
export function getGoalConstraints(
	currentLevel: string | null,
	targetBand: VstepBand,
): GoalConstraints {
	const current = LEVEL_ORDER[currentLevel ?? "A2"] ?? 0
	const target = LEVEL_ORDER[targetBand] ?? 0
	const gap = Math.max(0, target - current)

	if (gap === 0) {
		return { minDeadlineMonths: 1, minDailyMinutes: 15, hint: null }
	}

	const minDeadlineMonths = gap === 1 ? 3 : gap === 2 ? 6 : 12
	const minDailyMinutes = gap === 1 ? 15 : gap === 2 ? 30 : 60

	const hint =
		gap >= 3
			? `Từ ${currentLevel} lên ${targetBand} cần ít nhất 12 tháng và 1 giờ/ngày`
			: gap === 2
				? `Từ ${currentLevel} lên ${targetBand} cần ít nhất 6 tháng và 30 phút/ngày`
				: `Từ ${currentLevel} lên ${targetBand} cần ít nhất 3 tháng và 15 phút/ngày`

	return { minDeadlineMonths, minDailyMinutes, hint }
}

export function isDeadlineAllowed(months: number | undefined, minDeadlineMonths: number): boolean {
	if (months === undefined) return true
	return months >= minDeadlineMonths
}

export function isDailyTimeAllowed(minutes: number | undefined, minDailyMinutes: number): boolean {
	if (minutes === undefined) return true
	return minutes >= minDailyMinutes
}

/** Convert months offset to ISO deadline string. */
export function monthsToDeadline(months: number | undefined): string | undefined {
	if (months == null) return undefined
	return new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString()
}

/** Find the closest deadline preset from an ISO date. Returns months or undefined. */
export function deadlineToMonths(deadline: string | undefined): number | undefined {
	if (!deadline) return undefined
	const diffMs = new Date(deadline).getTime() - Date.now()
	const diffMonths = Math.round(diffMs / (30 * 24 * 60 * 60 * 1000))
	const match = DEADLINES.find((d) => d.months === diffMonths)
	if (match) return match.months
	// Snap to closest preset
	const defined = DEADLINES.filter((d) => d.months !== undefined)
	const closest = defined.reduce((prev, curr) =>
		Math.abs((curr.months as number) - diffMonths) < Math.abs((prev.months as number) - diffMonths)
			? curr
			: prev,
	)
	return closest.months
}

/** Find the closest daily time preset from minutes. Returns minutes or undefined. */
export function minutesToPreset(minutes: number | null | undefined): number | undefined {
	if (minutes == null) return undefined
	const match = DAILY_TIMES.find((t) => t.minutes === minutes)
	if (match) return match.minutes
	const defined = DAILY_TIMES.filter((t) => t.minutes !== undefined)
	const closest = defined.reduce((prev, curr) =>
		Math.abs((curr.minutes as number) - minutes) < Math.abs((prev.minutes as number) - minutes)
			? curr
			: prev,
	)
	return closest.minutes
}
