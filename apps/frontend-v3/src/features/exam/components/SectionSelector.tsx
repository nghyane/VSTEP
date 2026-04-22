import { Icon } from "#/components/Icon"
import type { ExamDetail, SkillKey } from "#/features/exam/types"
import { cn } from "#/lib/utils"

interface Props {
	detail: ExamDetail
	selected: Set<SkillKey>
	onToggleSkill: (skill: SkillKey) => void
}

const SKILL_META: Record<
	SkillKey,
	{ label: string; en: string; accentBg: string; accentText: string; accentCheck: string }
> = {
	listening: {
		label: "Nghe",
		en: "Listening",
		accentBg: "bg-skill-listening",
		accentText: "text-skill-listening",
		accentCheck: "bg-skill-listening border-skill-listening",
	},
	reading: {
		label: "Đọc",
		en: "Reading",
		accentBg: "bg-skill-reading",
		accentText: "text-skill-reading",
		accentCheck: "bg-skill-reading border-skill-reading",
	},
	writing: {
		label: "Viết",
		en: "Writing",
		accentBg: "bg-skill-writing",
		accentText: "text-skill-writing",
		accentCheck: "bg-skill-writing border-skill-writing",
	},
	speaking: {
		label: "Nói",
		en: "Speaking",
		accentBg: "bg-skill-speaking",
		accentText: "text-skill-speaking",
		accentCheck: "bg-skill-speaking border-skill-speaking",
	},
}

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"]

interface SectionRow {
	id: string
	label: string
	itemCount: number
	itemUnit: string
	durationMinutes: number
}

function getSkillSections(skill: SkillKey, detail: ExamDetail): SectionRow[] {
	const { version } = detail
	if (skill === "listening") {
		return [...version.listening_sections]
			.sort((a, b) => a.display_order - b.display_order)
			.map((s) => ({
				id: s.id,
				label: s.part_title,
				itemCount: s.items.length,
				itemUnit: "câu",
				durationMinutes: s.duration_minutes,
			}))
	}
	if (skill === "reading") {
		return [...version.reading_passages]
			.sort((a, b) => a.display_order - b.display_order)
			.map((p) => ({
				id: p.id,
				label: `Phần ${p.part} — ${p.title}`,
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
				label: `Phần ${t.part} — ${t.task_type === "letter" ? "Viết thư" : "Viết luận"}`,
				itemCount: t.min_words,
				itemUnit: "từ tối thiểu",
				durationMinutes: t.duration_minutes,
			}))
	}
	// speaking
	const TYPE_LABEL: Record<string, string> = {
		social: "Giao tiếp xã hội",
		solution: "Đề xuất giải pháp",
		topic: "Thảo luận chủ đề",
	}
	return [...version.speaking_parts]
		.sort((a, b) => a.display_order - b.display_order)
		.map((p) => ({
			id: p.id,
			label: `Phần ${p.part} — ${TYPE_LABEL[p.type] ?? p.type}`,
			itemCount: p.duration_minutes,
			itemUnit: "phút",
			durationMinutes: p.duration_minutes,
		}))
}

function getSkillTotals(
	skill: SkillKey,
	detail: ExamDetail,
): { minutes: number; count: number; unit: string } {
	const sections = getSkillSections(skill, detail)
	const minutes = sections.reduce((s, x) => s + x.durationMinutes, 0)
	if (skill === "listening" || skill === "reading") {
		return { minutes, count: sections.reduce((s, x) => s + x.itemCount, 0), unit: "câu" }
	}
	return { minutes, count: sections.length, unit: "phần" }
}

export function SectionSelector({ detail, selected, onToggleSkill }: Props) {
	const isAllSelected = SKILL_ORDER.every((s) => selected.has(s))

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-bold text-foreground">Chọn kỹ năng luyện tập</h2>
				<p className="text-xs text-subtle">
					{selected.size === 0 ? "Chưa chọn — sẽ làm full test" : `${selected.size} kỹ năng đã chọn`}
				</p>
			</div>

			{SKILL_ORDER.map((skill) => {
				const meta = SKILL_META[skill]
				const isSelected = selected.has(skill)
				const { minutes, count, unit } = getSkillTotals(skill, detail)
				const sections = getSkillSections(skill, detail)

				return (
					<div
						key={skill}
						className={cn("card overflow-hidden transition-colors", isSelected ? "border-border" : "")}
					>
						{/* Skill header row — clickable to toggle */}
						<label className="flex cursor-pointer items-center gap-4 px-5 py-4">
							<input
								type="checkbox"
								className="sr-only"
								checked={isSelected}
								onChange={() => onToggleSkill(skill)}
								aria-label={meta.label}
							/>

							{/* Visual checkbox */}
							<div
								className={cn(
									"flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
									isSelected ? meta.accentCheck : "border-border",
								)}
							>
								{isSelected && <Icon name="check" size="xs" className="text-white" />}
							</div>

							{/* Accent bar */}
							<div className={cn("h-8 w-1 rounded-full shrink-0", meta.accentBg)} />

							{/* Info */}
							<div className="flex-1 min-w-0">
								<p className={cn("text-sm font-bold", meta.accentText)}>{meta.label}</p>
								<p className="text-xs text-subtle">{meta.en}</p>
							</div>

							{/* Totals */}
							<div className="shrink-0 text-right text-xs tabular-nums text-muted">
								<p className="font-semibold">{minutes} phút</p>
								<p>
									{count} {unit}
								</p>
							</div>
						</label>

						{/* Section list — always visible */}
						<div className="border-t border-border-light">
							{sections.map((sec, idx) => (
								<div
									key={sec.id}
									className={cn(
										"flex items-center gap-3 px-5 py-2.5 text-xs text-muted",
										idx < sections.length - 1 && "border-b border-border-light",
										isSelected ? "bg-background/60" : "bg-background/30",
									)}
								>
									<span className={cn("w-1 h-4 rounded-full shrink-0 opacity-40", meta.accentBg)} />
									<span className="flex-1 min-w-0 truncate font-medium text-foreground/80">{sec.label}</span>
									<span className="shrink-0 tabular-nums text-subtle">
										{sec.itemCount} {sec.itemUnit}
									</span>
									<span className="shrink-0 tabular-nums text-subtle">~{sec.durationMinutes} phút</span>
								</div>
							))}
						</div>
					</div>
				)
			})}

			{!isAllSelected && selected.size > 0 && (
				<p className="text-xs text-subtle text-center">Chọn tất cả 4 kỹ năng để làm full test</p>
			)}
		</div>
	)
}
