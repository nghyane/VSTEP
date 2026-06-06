import type { McqReviewGroup } from "#/features/exam/components/result/helpers"
import {
	mcqGroups,
	resultSkillSummaries,
	scoreLabel,
	statusLabel,
} from "#/features/exam/components/result/helpers"
import type { ExamResultStatus, SessionResultsData, SkillKey } from "#/features/exam/types"

export interface ResultOverallView {
	readonly scoreLabel: string
	readonly maxScoreLabel: string
	readonly resultLabel: string
	readonly status: ExamResultStatus
	readonly applicable: boolean
}

export interface ResultSkillView {
	readonly key: SkillKey
	readonly label: string
	readonly scoreLabel: string
	readonly detailLabel: string
	readonly status: ExamResultStatus
	readonly needsAttention: boolean
}

export interface ResultViewModel {
	readonly overall: ResultOverallView
	readonly skills: ResultSkillView[]
	readonly statusNotice: ResultStatusNotice | null
}

export interface ResultStatusNotice {
	readonly label: string
	readonly tone: "warning" | "danger" | "muted"
}

export interface McqSkillReviewView {
	readonly title: string
	readonly groups: McqReviewGroup[]
	readonly correct: number
	readonly total: number
	readonly reviewCount: number
	readonly hasReviewItems: boolean
}

export function buildResultViewModel(result: SessionResultsData): ResultViewModel {
	const overall = result.summary.overall
	const skills = resultSkillSummaries(result).map((skill): ResultSkillView => {
		const needsAttention = skillNeedsAttention(skill)
		return {
			key: skill.key,
			label: skill.label,
			scoreLabel: skill.score_on_10 === null ? statusLabel(skill.status) : scoreLabel(skill.score_on_10),
			detailLabel: skillDetailLabel(skill),
			status: skill.status,
			needsAttention,
		}
	})

	return {
		overall: {
			scoreLabel: overall.score_on_10 === null ? "—" : String(overall.score_on_10),
			maxScoreLabel: `/${overall.max_score}`,
			resultLabel:
				overall.result_label ??
				(overall.applicable ? statusLabel(result.summary.score_status) : "Không xếp bậc"),
			status: result.summary.score_status,
			applicable: overall.applicable,
		},
		skills,
		statusNotice: resultStatusNotice(result),
	}
}

export function buildMcqSkillReviewView(
	result: SessionResultsData,
	skill: "listening" | "reading",
): McqSkillReviewView {
	const groups = mcqGroups(result, skill)
	const correct = groups.reduce((sum, group) => sum + group.correct, 0)
	const total = groups.reduce((sum, group) => sum + group.total, 0)
	const reviewCount = groups.reduce(
		(sum, group) => sum + group.items.filter((item) => item.status !== "correct").length,
		0,
	)

	return {
		title: skill === "listening" ? "Nghe" : "Đọc",
		groups,
		correct,
		total,
		reviewCount,
		hasReviewItems: reviewCount > 0,
	}
}

function skillNeedsAttention(skill: ReturnType<typeof resultSkillSummaries>[number]): boolean {
	if (skill.status !== "ready") return true
	if (skill.raw) return skill.raw.wrong > 0
	return skill.score_on_10 !== null && skill.score_on_10 < 6
}

function skillDetailLabel(skill: ReturnType<typeof resultSkillSummaries>[number]): string {
	if (skill.raw) return `${skill.raw.correct}/${skill.raw.total} đúng`
	if (skill.score_on_10 === null) return statusLabel(skill.status)
	return scoreLabel(skill.score_on_10)
}

function resultStatusNotice(result: SessionResultsData): ResultStatusNotice | null {
	const { summary } = result
	if (summary.has_failed_jobs || summary.score_status === "failed" || summary.feedback_status === "failed") {
		return { label: statusLabel("failed"), tone: "danger" }
	}
	if (
		summary.has_pending_jobs ||
		summary.score_status === "pending" ||
		summary.score_status === "partial" ||
		summary.feedback_status === "pending" ||
		summary.feedback_status === "partial"
	) {
		return { label: statusLabel("pending"), tone: "warning" }
	}
	if (summary.score_status === "not_submitted" || summary.score_status === "none") {
		return { label: statusLabel(summary.score_status), tone: "muted" }
	}
	return null
}
