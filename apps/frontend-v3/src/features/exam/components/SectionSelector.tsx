import type { ExamDetail, SkillKey } from "#/features/exam/types"
import { cn } from "#/lib/utils"

interface Props {
	detail: ExamDetail
	selected: Set<string>
	onToggleSection: (id: string) => void
	onToggleSkill: (sectionIds: string[]) => void
}

const SKILL_META: Record<
	SkillKey,
	{ label: string; en: string; accentBg: string; accentText: string; selectedBg: string; checkBg: string }
> = {
	listening: {
		label: "Nghe",
		en: "Listening",
		accentBg: "bg-skill-listening",
		accentText: "text-skill-listening",
		selectedBg: "bg-skill-listening/8",
		checkBg: "bg-skill-listening border-skill-listening",
	},
	reading: {
		label: "Đọc",
		en: "Reading",
		accentBg: "bg-skill-reading",
		accentText: "text-skill-reading",
		selectedBg: "bg-skill-reading/8",
		checkBg: "bg-skill-reading border-skill-reading",
	},
	writing: {
		label: "Viết",
		en: "Writing",
		accentBg: "bg-skill-writing",
		accentText: "text-skill-writing",
		selectedBg: "bg-skill-writing/8",
		checkBg: "bg-skill-writing border-skill-writing",
	},
	speaking: {
		label: "Nói",
		en: "Speaking",
		accentBg: "bg-skill-speaking",
		accentText: "text-skill-speaking",
		selectedBg: "bg-skill-speaking/8",
		checkBg: "bg-skill-speaking border-skill-speaking",
	},
}

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"]

interface PartRow {
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

function getPartRows(skill: SkillKey, detail: ExamDetail): PartRow[] {
	const { version } = detail

	if (skill === "listening") {
		// Group individual sections by part number
		const byPart = new Map<number, typeof version.listening_sections>()
		for (const s of version.listening_sections) {
			const arr = byPart.get(s.part) ?? []
			arr.push(s)
			byPart.set(s.part, arr)
		}
		return [...byPart.entries()]
			.sort(([a], [b]) => a - b)
			.map(([part, secs]) => ({
				// Use first section's id as the part representative ID
				id: secs.sort((a, b) => a.display_order - b.display_order)[0].id,
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
				label: `Phần ${t.part} — ${t.task_type === "letter" ? `Viết thư (~${t.min_words} từ)` : `Viết luận (~${t.min_words} từ)`}`,
				itemCount: 1,
				itemUnit: "bài",
				durationMinutes: t.duration_minutes,
			}))
	}

	// speaking
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

export function SectionSelector({ detail, selected, onToggleSection, onToggleSkill }: Props) {
	const totalSelected = SKILL_ORDER.flatMap((skill) => getPartRows(skill, detail)).filter((r) =>
		selected.has(r.id),
	).length

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-bold text-foreground">Chọn phần luyện tập</h2>
				<p className="text-xs text-subtle">
					{totalSelected === 0 ? "Chưa chọn — sẽ làm full test" : `${totalSelected} phần đã chọn`}
				</p>
			</div>

			{SKILL_ORDER.map((skill) => {
				const meta = SKILL_META[skill]
				const parts = getPartRows(skill, detail)
				const partIds = parts.map((p) => p.id)
				const selectedCount = partIds.filter((id) => selected.has(id)).length
				const allSelected = selectedCount === partIds.length && partIds.length > 0
				const totalMinutes = parts.reduce((s, p) => s + p.durationMinutes, 0)
				const totalCount = parts.reduce((s, p) => s + (p.itemUnit === "câu" ? p.itemCount : 0), 0)
				const countLabel =
					skill === "listening" || skill === "reading" ? `${totalCount} câu` : `${parts.length} phần`

				return (
					<div key={skill} className="card overflow-hidden">
						{/* Skill header */}
						<div className="flex items-center justify-between px-5 py-3.5">
							<div className="flex items-center gap-3">
								<div className={cn("h-5 w-1 rounded-full shrink-0", meta.accentBg)} />
								<span className={cn("text-sm font-bold", meta.accentText)}>{meta.label}</span>
								<span className="text-xs text-subtle tabular-nums">
									{totalMinutes} phút · {countLabel}
								</span>
							</div>
							<button
								type="button"
								onClick={() => onToggleSkill(partIds)}
								className={cn(
									"rounded-full px-2.5 py-1 text-xs font-bold transition-colors",
									allSelected
										? cn("text-white", meta.checkBg)
										: "text-subtle hover:text-foreground hover:bg-background",
								)}
							>
								{allSelected ? "Bỏ chọn" : "Chọn tất cả"}
							</button>
						</div>

						{/* Part rows */}
						<div className="border-t border-border-light">
							{parts.map((part, idx) => {
								const isSelected = selected.has(part.id)
								const isLast = idx === parts.length - 1

								return (
									<label
										key={part.id}
										className={cn(
											"flex cursor-pointer items-center gap-3 px-5 py-3 transition-colors",
											!isLast && "border-b border-border-light",
											isSelected ? meta.selectedBg : "hover:bg-background/60",
										)}
									>
										<input
											type="checkbox"
											className="sr-only"
											checked={isSelected}
											onChange={() => onToggleSection(part.id)}
											aria-label={part.label}
										/>
										<div
											className={cn(
												"flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
												isSelected ? meta.checkBg : "border-border bg-surface",
											)}
										>
											{isSelected && (
												<svg
													viewBox="0 0 12 10"
													className="h-3 w-3 text-white"
													fill="none"
													stroke="currentColor"
													strokeWidth="2.5"
													strokeLinecap="round"
													strokeLinejoin="round"
													aria-hidden="true"
												>
													<polyline points="1,5 4.5,8.5 11,1" />
												</svg>
											)}
										</div>
										<span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
											{part.label}
										</span>
										<span className="shrink-0 text-xs tabular-nums text-subtle">
											{part.itemCount} {part.itemUnit}
										</span>
										<span className="shrink-0 text-xs tabular-nums text-subtle">
											~{part.durationMinutes} phút
										</span>
									</label>
								)
							})}
						</div>
					</div>
				)
			})}
		</div>
	)
}
