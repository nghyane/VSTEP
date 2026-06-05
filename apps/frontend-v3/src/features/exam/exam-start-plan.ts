import type { ExamOverview, SkillKey } from "#/features/exam/types"

export type DurationMode = "standard" | "slow" | "fast"
export type SessionMode = "full" | "custom"

export interface DurationModeOption {
	key: DurationMode
	label: string
	description: string
}

export interface DurationPlan {
	baseMinutes: number
	displayMinutes: number
	timeExtensionFactor: number
}

export const EXAM_SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"]

export const DURATION_MODE_OPTIONS: DurationModeOption[] = [
	{ key: "standard", label: "Chuẩn", description: "Theo thời lượng đề" },
	{ key: "slow", label: "Luyện chậm", description: "+20 phút" },
	{ key: "fast", label: "Ôn tập nhanh", description: "−10 phút" },
]

export function computeExamCost(
	overview: ExamOverview,
	selected: Set<SkillKey>,
	isFullTest: boolean,
): number {
	const { full_test_cost_coins: fullCost, custom_per_skill_coins: perSkill } = overview.pricing
	if (isFullTest) return fullCost
	if (selected.size === 0) return 0
	return Math.min(fullCost, perSkill * selected.size)
}

export function computeBaseDurationMinutes(
	overview: ExamOverview,
	selected: Set<SkillKey>,
	isFullTest: boolean,
): number {
	return EXAM_SKILL_ORDER.reduce((total, skill) => {
		if (!isFullTest && !selected.has(skill)) return total
		return total + overview.skill_summaries[skill].duration_minutes
	}, 0)
}

export function computeModeDuration(baseMinutes: number, mode: DurationMode): number {
	if (baseMinutes <= 0) return 0
	if (mode === "slow") return baseMinutes + 20
	if (mode === "fast") return Math.max(1, baseMinutes - 10)
	return baseMinutes
}

export function buildDurationPlan(baseMinutes: number, mode: DurationMode): DurationPlan {
	const displayMinutes = computeModeDuration(baseMinutes, mode)
	return {
		baseMinutes,
		displayMinutes,
		timeExtensionFactor: baseMinutes > 0 ? displayMinutes / baseMinutes : 1,
	}
}

export function selectedSkillsForStart(isFullTest: boolean, selected: Set<SkillKey>): SkillKey[] {
	if (isFullTest) return [...EXAM_SKILL_ORDER]
	return EXAM_SKILL_ORDER.filter((skill) => selected.has(skill))
}

export function buildSkillDurationMinutes(overview: ExamOverview): Record<SkillKey, number> {
	return {
		listening: overview.skill_summaries.listening.duration_minutes,
		reading: overview.skill_summaries.reading.duration_minutes,
		writing: overview.skill_summaries.writing.duration_minutes,
		speaking: overview.skill_summaries.speaking.duration_minutes,
	}
}
