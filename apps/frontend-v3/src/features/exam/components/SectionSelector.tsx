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
	{
		label: string
		description: string
		accentBg: string
		accentText: string
		accentBorder: string
		accentSelected: string
		accentCheck: string
	}
> = {
	listening: {
		label: "Nghe",
		description: "Listening",
		accentBg: "bg-skill-listening",
		accentText: "text-skill-listening",
		accentBorder: "border-skill-listening/40",
		accentSelected: "bg-skill-listening/8",
		accentCheck: "bg-skill-listening border-skill-listening",
	},
	reading: {
		label: "Đọc",
		description: "Reading",
		accentBg: "bg-skill-reading",
		accentText: "text-skill-reading",
		accentBorder: "border-skill-reading/40",
		accentSelected: "bg-skill-reading/8",
		accentCheck: "bg-skill-reading border-skill-reading",
	},
	writing: {
		label: "Viết",
		description: "Writing",
		accentBg: "bg-skill-writing",
		accentText: "text-skill-writing",
		accentBorder: "border-skill-writing/40",
		accentSelected: "bg-skill-writing/8",
		accentCheck: "bg-skill-writing border-skill-writing",
	},
	speaking: {
		label: "Nói",
		description: "Speaking",
		accentBg: "bg-skill-speaking",
		accentText: "text-skill-speaking",
		accentBorder: "border-skill-speaking/40",
		accentSelected: "bg-skill-speaking/8",
		accentCheck: "bg-skill-speaking border-skill-speaking",
	},
}

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"]

function getSkillMinutes(skill: SkillKey, detail: ExamDetail): number {
	if (skill === "listening")
		return detail.version.listening_sections.reduce((s, x) => s + x.duration_minutes, 0)
	if (skill === "reading") return detail.version.reading_passages.reduce((s, x) => s + x.duration_minutes, 0)
	if (skill === "writing") return detail.version.writing_tasks.reduce((s, x) => s + x.duration_minutes, 0)
	return detail.version.speaking_parts.reduce((s, x) => s + x.duration_minutes, 0)
}

function getSkillCount(skill: SkillKey, detail: ExamDetail): number {
	if (skill === "listening") return detail.version.listening_sections.reduce((s, x) => s + x.items.length, 0)
	if (skill === "reading") return detail.version.reading_passages.reduce((s, x) => s + x.items.length, 0)
	if (skill === "writing") return detail.version.writing_tasks.length
	return detail.version.speaking_parts.length
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
				const minutes = getSkillMinutes(skill, detail)
				const count = getSkillCount(skill, detail)
				const unit = skill === "writing" || skill === "speaking" ? "phần" : "câu"

				return (
					<label
						key={skill}
						className={cn(
							"card flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors",
							isSelected ? meta.accentSelected : "hover:bg-background/60",
						)}
					>
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
							<p className="text-xs text-subtle">{meta.description}</p>
						</div>

						{/* Stats */}
						<div className="shrink-0 text-right text-xs tabular-nums text-muted">
							<p className="font-semibold">{minutes} phút</p>
							<p>
								{count} {unit}
							</p>
						</div>
					</label>
				)
			})}

			{/* Full test hint */}
			{!isAllSelected && selected.size > 0 && (
				<p className="text-xs text-subtle text-center">Chọn tất cả 4 kỹ năng để làm full test</p>
			)}
		</div>
	)
}
