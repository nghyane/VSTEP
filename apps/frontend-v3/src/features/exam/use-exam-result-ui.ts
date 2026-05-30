import { useMemo } from "react"
import type {
	ExamVersion,
	ExamVersionListeningSection,
	McqDetailItem,
	SessionResultsData,
	SkillKey,
} from "#/features/exam/types"
import type { AssessmentFeedback, CriterionScore, RubricCriteriaMeta } from "#/features/grading/types"

export interface ExamResultUi {
	examTitle: string
	overallBand: number | null
	level: string
	scores: unknown
	activeSkills: SkillKey[]
	hasPending: boolean
	mcqParts: McqPart[]
	writingSections: WritingSection[]
	speakingSections: SpeakingSection[]
	writingRubric?: RubricCriteriaMeta[]
	speakingRubric?: RubricCriteriaMeta[]
}

export interface McqPart {
	id: string
	label: string
	items: Array<{ display_order: number; id: string }>
	detailMap: Map<string, McqDetailItem>
	correct: number
	total: number
}

export interface WritingSection {
	id: string
	label: string
	part?: number
	overallBand: number | null
	criterionScores: CriterionScore[] | null
	feedback: AssessmentFeedback | null
	text: string
	wordCount: number
	prompt?: string
}

export interface SpeakingSection {
	id: string
	label: string
	part?: number
	overallBand: number | null
	criterionScores: CriterionScore[] | null
	feedback: AssessmentFeedback | null
	audioUrl: string | null
	transcript: string | null
}

export function useExamResultUi(
	examTitle: string,
	version: ExamVersion,
	activeSkills: SkillKey[],
	results: SessionResultsData,
): ExamResultUi {
	const { scores, overall_band, level, mcq_detail, writing_feedback, speaking_feedback } = results

	const hasPending =
		writing_feedback.some((w) => w.overall_band === null) ||
		speaking_feedback.some((s) => s.overall_band === null)

	const mcqParts = useMemo<McqPart[]>(() => {
		const parts: McqPart[] = []
		const detailMap = new Map(mcq_detail.map((d) => [d.item_ref_id, d]))

		if (activeSkills.includes("listening")) {
			for (const { part, sections } of groupByPart(version.listening_sections)) {
				const allItems = sections.flatMap((s) =>
					[...s.items].sort((a, b) => a.display_order - b.display_order),
				)
				const correct = allItems.reduce((n, it) => n + (detailMap.get(it.id)?.is_correct ? 1 : 0), 0)
				parts.push({
					id: `listening-${part}`,
					label: `Nghe · Part ${part}`,
					items: allItems,
					detailMap,
					correct,
					total: allItems.length,
				})
			}
		}
		if (activeSkills.includes("reading")) {
			const sorted = [...version.reading_passages].sort(
				(a, b) => a.part - b.part || a.display_order - b.display_order,
			)
			for (const p of sorted) {
				const items = [...p.items].sort((a, b) => a.display_order - b.display_order)
				const correct = items.reduce((n, it) => n + (detailMap.get(it.id)?.is_correct ? 1 : 0), 0)
				parts.push({ id: p.id, label: `Đọc · ${p.title}`, items, detailMap, correct, total: items.length })
			}
		}
		return parts
	}, [version, activeSkills, mcq_detail])

	const writingSections = useMemo<WritingSection[]>(() => {
		if (!activeSkills.includes("writing")) return []
		return writing_feedback.map((fb, i) => {
			const task = version.writing_tasks.find((t) => t.id === fb.task_id)
			return {
				id: fb.submission_id,
				label: `Viết · Bài ${i + 1}${task ? ` (Part ${task.part})` : ""}`,
				part: task?.part,
				overallBand: fb.overall_band,
				criterionScores: fb.criterion_scores,
				feedback: fb.feedback,
				text: fb.text,
				wordCount: fb.word_count,
				prompt: task?.prompt,
			}
		})
	}, [version, activeSkills, writing_feedback])

	const speakingSections = useMemo<SpeakingSection[]>(() => {
		if (!activeSkills.includes("speaking")) return []
		return speaking_feedback.map((fb, i) => {
			const part = version.speaking_parts.find((p) => p.id === fb.part_id)
			return {
				id: fb.submission_id,
				label: `Nói · Phần ${i + 1}${part ? ` (Part ${part.part})` : ""}`,
				part: part?.part,
				overallBand: fb.overall_band,
				criterionScores: fb.criterion_scores,
				feedback: fb.feedback,
				audioUrl: fb.audio_url,
				transcript: fb.transcript,
			}
		})
	}, [version, activeSkills, speaking_feedback])

	return {
		examTitle,
		overallBand: overall_band,
		level,
		scores,
		activeSkills,
		hasPending,
		mcqParts,
		writingSections,
		speakingSections,
	}
}

function groupByPart(
	sections: ExamVersionListeningSection[],
): Array<{ part: number; sections: ExamVersionListeningSection[] }> {
	const byPart = new Map<number, ExamVersionListeningSection[]>()
	for (const sec of sections) {
		const arr = byPart.get(sec.part) ?? []
		arr.push(sec)
		byPart.set(sec.part, arr)
	}
	return [...byPart.entries()].sort((a, b) => a[0] - b[0]).map(([part, sections]) => ({ part, sections }))
}
