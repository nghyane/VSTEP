import type { ExamDetail, SkillKey } from "#/features/exam/types"

export interface PartRow {
	id: string
	label: string
	itemCount: number
	itemUnit: string
	durationMinutes: number
}

const SPEAKING_TYPE_LABEL: Record<string, string> = {
	social: "Giao tiếp xã hội",
	solution: "Đề xuất giải pháp",
	topic: "Thảo luận chủ đề",
}

export function getPartRows(skill: SkillKey, detail: ExamDetail): PartRow[] {
	const { version } = detail

	if (skill === "listening") {
		const byPart = new Map<number, typeof version.listening_sections>()
		for (const s of version.listening_sections) {
			const arr = byPart.get(s.part) ?? []
			arr.push(s)
			byPart.set(s.part, arr)
		}
		return [...byPart.entries()]
			.sort(([a], [b]) => a - b)
			.map(([part, secs]) => ({
				id: `listening-part-${part}`,
				label: `Phần ${part}`,
				itemCount: secs.reduce((s, x) => s + x.items.length, 0),
				itemUnit: "câu",
				durationMinutes: secs.reduce((s, x) => s + x.duration_minutes, 0),
			}))
	}

	if (skill === "reading") {
		return [...version.reading_passages]
			.sort((a, b) => a.display_order - b.display_order)
			.map((p) => ({
				id: p.id,
				label: `Phần ${p.part}`,
				itemCount: p.items.length,
				itemUnit: "câu",
				durationMinutes: p.duration_minutes,
			}))
	}

	if (skill === "writing") {
		return [...version.writing_tasks]
			.sort((a, b) => a.display_order - b.display_order)
			.map((t) => ({
				id: t.id,
				label: `Phần ${t.part} — ${
					t.task_type === "letter" ? `Viết thư (${t.min_words} từ)` : `Viết luận (${t.min_words} từ)`
				}`,
				itemCount: 1,
				itemUnit: "bài",
				durationMinutes: t.duration_minutes,
			}))
	}

	return [...version.speaking_parts]
		.sort((a, b) => a.display_order - b.display_order)
		.map((p) => ({
			id: p.id,
			label: `Phần ${p.part} — ${SPEAKING_TYPE_LABEL[p.type] ?? p.type}`,
			itemCount: p.duration_minutes,
			itemUnit: "phút",
			durationMinutes: p.duration_minutes,
		}))
}

export function getSkillTotals(skill: SkillKey, detail: ExamDetail): { minutes: number; countLabel: string } {
	const parts = getPartRows(skill, detail)
	const minutes = parts.reduce((s, p) => s + p.durationMinutes, 0)
	if (skill === "listening" || skill === "reading") {
		const total = parts.reduce((s, p) => s + p.itemCount, 0)
		return { minutes, countLabel: `${total} câu` }
	}
	return { minutes, countLabel: `${parts.length} phần` }
}
