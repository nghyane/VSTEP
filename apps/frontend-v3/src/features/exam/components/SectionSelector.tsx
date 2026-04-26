import { useState } from "react"
import { Icon } from "#/components/Icon"
import type { ExamDetail, SkillKey } from "#/features/exam/types"
import { skills } from "#/lib/skills"
import { cn } from "#/lib/utils"

interface Props {
	detail: ExamDetail
	selected: Set<SkillKey>
	onToggleSkill: (skill: SkillKey) => void
}

const SKILL_META: Record<SkillKey, { label: string; selectedBg: string; checkBg: string }> = {
	listening: {
		label: "Nghe",
		selectedBg: "bg-skill-listening/8",
		checkBg: "bg-skill-listening border-skill-listening",
	},
	reading: {
		label: "Đọc",
		selectedBg: "bg-skill-reading/8",
		checkBg: "bg-skill-reading border-skill-reading",
	},
	writing: {
		label: "Viết",
		selectedBg: "bg-skill-writing/8",
		checkBg: "bg-skill-writing border-skill-writing",
	},
	speaking: {
		label: "Nói",
		selectedBg: "bg-skill-speaking/8",
		checkBg: "bg-skill-speaking border-skill-speaking",
	},
}

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"]

const SPEAKING_TYPE_LABEL: Record<string, string> = {
	social: "Giao tiếp xã hội",
	solution: "Đề xuất giải pháp",
	topic: "Thảo luận chủ đề",
}

interface PartRow {
	id: string
	label: string
	itemCount: number
	itemUnit: string
	durationMinutes: number
}

function getPartRows(skill: SkillKey, detail: ExamDetail): PartRow[] {
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
				label: `Phần ${t.part} — ${t.task_type === "letter" ? `Viết thư (${t.min_words} từ)` : `Viết luận (${t.min_words} từ)`}`,
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

function getSkillTotals(skill: SkillKey, detail: ExamDetail): { minutes: number; countLabel: string } {
	const parts = getPartRows(skill, detail)
	const minutes = parts.reduce((s, p) => s + p.durationMinutes, 0)
	if (skill === "listening" || skill === "reading") {
		const total = parts.reduce((s, p) => s + p.itemCount, 0)
		return { minutes, countLabel: `${total} câu` }
	}
	return { minutes, countLabel: `${parts.length} phần` }
}

export function SectionSelector({ detail, selected, onToggleSkill }: Props) {
	const [expanded, setExpanded] = useState<Set<SkillKey>>(new Set())
	const isAllSelected = SKILL_ORDER.every((s) => selected.has(s))

	function handleToggleExpand(skill: SkillKey) {
		setExpanded((prev) => {
			const next = new Set(prev)
			if (next.has(skill)) next.delete(skill)
			else next.add(skill)
			return next
		})
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-bold text-foreground">Chọn phần luyện tập</h2>
				<p className="text-xs text-subtle">
					{selected.size === 0 ? "Chưa chọn — sẽ làm full test" : `${selected.size} kỹ năng đã chọn`}
				</p>
			</div>

			{SKILL_ORDER.map((skill) => {
				const meta = SKILL_META[skill]
				const skillDef = skills.find((s) => s.key === skill)
				const isSelected = selected.has(skill)
				const isExpanded = expanded.has(skill)
				const { minutes, countLabel } = getSkillTotals(skill, detail)
				const parts = getPartRows(skill, detail)

				return (
					<div
						key={skill}
						className={cn(
							"card overflow-hidden transition-[box-shadow,transform,border-color] duration-200",
							isSelected && "-translate-y-0.5",
						)}
						style={{
							boxShadow: `inset 6px 0 0 ${isSelected ? (skillDef?.color ?? "transparent") : "transparent"}`,
							borderColor:
								isSelected && skillDef?.color
									? `color-mix(in srgb, ${skillDef.color} 35%, var(--color-border))`
									: undefined,
						}}
					>
						{/* Skill header row */}
						<div
							className={cn(
								"flex items-center gap-4 px-5 py-3.5 transition-colors",
								isSelected ? meta.selectedBg : "hover:bg-background/60",
							)}
						>
							{/* Checkbox — click selects/deselects skill */}
							<label className="flex cursor-pointer items-center gap-4 flex-1 min-w-0">
								<input
									type="checkbox"
									className="sr-only"
									checked={isSelected}
									onChange={() => onToggleSkill(skill)}
									aria-label={meta.label}
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

								{/* Skill info */}
								{skillDef && <Icon name={skillDef.icon} size="xs" style={{ color: skillDef.color }} />}
								<span className="text-sm font-bold" style={{ color: skillDef?.color }}>
									{meta.label}
								</span>
								<span className="text-xs text-subtle tabular-nums">
									{minutes} phút · {countLabel}
								</span>

								<span
									className={cn(
										"ml-auto mr-3 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border-2 transition-colors",
										isSelected
											? "border-transparent bg-foreground/5 text-muted"
											: "border-border text-foreground bg-surface",
									)}
								>
									{isSelected ? "Bỏ chọn" : "Chọn"}
								</span>
							</label>

							{/* Chevron — click expand/collapse parts */}
							<button
								type="button"
								onClick={() => handleToggleExpand(skill)}
								aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
								aria-expanded={isExpanded}
								className="shrink-0 flex items-center justify-center size-6 rounded-md text-muted hover:text-foreground hover:bg-border-light transition-colors"
							>
								<svg
									viewBox="0 0 16 16"
									className={cn("size-4 transition-transform duration-200", isExpanded && "rotate-180")}
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<polyline points="3,6 8,11 13,6" />
								</svg>
							</button>
						</div>

						{/* Parts dropdown — animated height collapse */}
						{isExpanded && (
							<div className="border-t border-border-light">
								{parts.map((part, idx) => (
									<div
										key={part.id}
										className={cn(
											"flex items-center gap-3 px-5 py-2.5",
											idx < parts.length - 1 && "border-b border-border-light",
											isSelected ? meta.selectedBg : "bg-background/30",
										)}
									>
										<span className="flex-1 text-sm text-foreground/80 font-medium">{part.label}</span>
										<span className="shrink-0 text-xs tabular-nums text-subtle">
											{part.itemCount} {part.itemUnit}
										</span>
										<span className="shrink-0 text-xs tabular-nums text-subtle">
											{part.durationMinutes} phút
										</span>
									</div>
								))}
							</div>
						)}
					</div>
				)
			})}

			{!isAllSelected && selected.size > 0 && (
				<p className="text-xs text-subtle text-center">Chọn tất cả 4 kỹ năng để làm full test</p>
			)}
		</div>
	)
}
