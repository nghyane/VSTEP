import type {
	ExamResultReviewSkill,
	ExamResultStatus,
	ExamResultSummary,
	McqDetailItem,
	SessionResultsData,
	SkillKey,
} from "#/features/exam/types"
import { round } from "#/lib/utils"

export const SKILL_ORDER: readonly SkillKey[] = ["listening", "reading", "writing", "speaking"]

export const SKILL_LABEL: Record<SkillKey, string> = {
	listening: "Nghe",
	reading: "Đọc",
	writing: "Viết",
	speaking: "Nói",
}

export type StatusTone = "success" | "warning" | "danger" | "muted"

export function statusTone(status: ExamResultStatus): StatusTone {
	if (status === "ready") return "success"
	if (status === "pending" || status === "partial") return "warning"
	if (status === "failed") return "danger"
	return "muted"
}

export function statusLabel(status: ExamResultStatus): string {
	if (status === "ready") return "Đã có kết quả"
	if (status === "pending") return "Đang chấm điểm"
	if (status === "partial") return "Còn đang chấm"
	if (status === "failed") return "Lỗi chấm điểm"
	if (status === "not_submitted") return "Chưa nộp"
	if (status === "none") return "Chưa có dữ liệu"
	return "Không áp dụng"
}

export function modeLabel(result: SessionResultsData): string {
	if (result.session.is_full_test) return "Thi thử 4 kỹ năng"
	const skills = result.session.selected_skills.map((key) => SKILL_LABEL[key] ?? key)
	return skills.length > 0 ? `Thi thử ${skills.join(" + ")}` : "Thi thử VSTEP"
}

export function bandLabel(value: number | null | undefined): string {
	return value === null || value === undefined ? "—" : `${round(value)}`
}

export function scoreLabel(value: number | null | undefined): string {
	return value === null || value === undefined ? "—" : `${round(value)}/10`
}

export function isProcessing(summary: ExamResultSummary): boolean {
	return summary.score_status === "pending" || summary.score_status === "partial"
}

export function orderedSkills<T extends { readonly key: SkillKey }>(skills: readonly T[]): T[] {
	return [...skills].sort((a, b) => SKILL_ORDER.indexOf(a.key) - SKILL_ORDER.indexOf(b.key))
}

export function reviewSkills(result: SessionResultsData): ExamResultReviewSkill[] {
	if (result.review.skills.length > 0) return orderedSkills(result.review.skills)

	return orderedSkills(
		result.session.selected_skills.map((key) => {
			const score = result.session.scores?.[key] ?? null
			const status: ExamResultStatus = score === null ? "not_submitted" : "ready"
			return {
				key,
				label: SKILL_LABEL[key],
				status,
				status_label: score === null ? "Chưa có điểm" : "Đã chấm",
				score_label: scoreLabel(score),
				issue_count: 0,
				section_ids: [],
			}
		}),
	)
}

export function defaultSkill(result: SessionResultsData): SkillKey {
	const skills = reviewSkills(result)
	const withIssues = skills.find((skill) => skill.issue_count > 0)
	if (withIssues) return withIssues.key
	const withScore = skills.find((skill) => (result.session.scores?.[skill.key] ?? null) !== null)
	if (withScore) return withScore.key
	return skills[0]?.key ?? "listening"
}

export function scorePercent(value: number | null | undefined): number {
	if (value === null || value === undefined) return 0
	return Math.max(0, Math.min(100, (value / 10) * 100))
}

export interface McqReviewItem {
	id: string
	no: number
	stem: string
	options: [string, string, string, string]
	status: McqDetailItem["answer_status"]
	statusLabel: string
	selectedLabel: string | null
	correctLabel: string
}

export interface McqReviewGroup {
	id: string
	skill: "listening" | "reading"
	label: string
	contextLabel: string | null
	contextBody: string | null
	correct: number
	total: number
	items: McqReviewItem[]
}

export function mcqGroups(result: SessionResultsData, skill: "listening" | "reading"): McqReviewGroup[] {
	if (!result.version) return []
	const detail = new Map(result.mcq_detail.map((item) => [`${item.item_ref_type}:${item.item_ref_id}`, item]))
	const groups: McqReviewGroup[] = []

	if (skill === "reading") {
		for (const passage of [...result.version.reading_passages].sort((a, b) => a.part - b.part)) {
			const items = [...passage.items].sort((a, b) => a.display_order - b.display_order)
			groups.push(
				buildGroup(
					`reading-${passage.part}`,
					"reading",
					`Part ${passage.part}`,
					passage.title,
					passage.passage,
					items,
					"exam_reading_item",
					detail,
				),
			)
		}
		return groups
	}

	const byPart = new Map<number, typeof result.version.listening_sections>()
	for (const section of result.version.listening_sections) {
		const list = byPart.get(section.part) ?? []
		list.push(section)
		byPart.set(section.part, list)
	}

	for (const [part, sections] of [...byPart].sort(([a], [b]) => a - b)) {
		const sorted = [...sections].sort((a, b) => a.display_order - b.display_order)
		const items = sorted.flatMap((section) =>
			[...section.items].sort((a, b) => a.display_order - b.display_order),
		)
		const transcript =
			sorted
				.map((section) => section.transcript)
				.filter((transcript): transcript is string => Boolean(transcript))
				.join("\n\n") || null
		groups.push(
			buildGroup(
				`listening-${part}`,
				"listening",
				`Part ${part}`,
				sorted[0]?.part_title ?? null,
				transcript,
				items,
				"exam_listening_item",
				detail,
			),
		)
	}
	return groups
}

function buildGroup(
	id: string,
	skill: "listening" | "reading",
	label: string,
	contextLabel: string | null,
	contextBody: string | null,
	items: readonly {
		readonly id: string
		readonly stem: string
		readonly options: [string, string, string, string]
	}[],
	itemRefType: "exam_listening_item" | "exam_reading_item",
	detail: ReadonlyMap<string, McqDetailItem>,
): McqReviewGroup {
	const reviewItems = items.map((item, index) => {
		const detailItem = detail.get(`${itemRefType}:${item.id}`)
		return {
			id: item.id,
			no: index + 1,
			stem: item.stem,
			options: item.options,
			status: detailItem?.answer_status ?? "unanswered",
			statusLabel: detailItem?.answer_status_label ?? "Chưa làm",
			selectedLabel: detailItem?.selected_label ?? null,
			correctLabel: detailItem?.correct_label ?? "—",
		}
	})

	return {
		id,
		skill,
		label,
		contextLabel,
		contextBody,
		correct: reviewItems.filter((item) => item.status === "correct").length,
		total: reviewItems.length,
		items: reviewItems,
	}
}
