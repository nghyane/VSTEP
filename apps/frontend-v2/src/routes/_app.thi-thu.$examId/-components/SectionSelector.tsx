import { Check } from "lucide-react"
import type { ExamSection, ExamSkillKey } from "#/lib/mock/thi-thu"
import { cn } from "#/lib/utils"

interface Props {
	sections: readonly ExamSection[]
	selected: Set<string>
	onToggleSection: (id: string) => void
	onToggleSkill: (skill: string, sectionIds: string[]) => void
}

const SKILL_META: Record<
	ExamSkillKey,
	{ label: string; accent: string; selectedBg: string; checkBg: string; checkBorder: string; textColor: string }
> = {
	listening: {
		label: "Nghe",
		accent: "bg-skill-listening",
		selectedBg: "bg-skill-listening/8",
		checkBg: "bg-skill-listening border-skill-listening",
		checkBorder: "border-skill-listening/40",
		textColor: "text-skill-listening",
	},
	reading: {
		label: "Đọc",
		accent: "bg-skill-reading",
		selectedBg: "bg-skill-reading/8",
		checkBg: "bg-skill-reading border-skill-reading",
		checkBorder: "border-skill-reading/40",
		textColor: "text-skill-reading",
	},
	writing: {
		label: "Viết",
		accent: "bg-skill-writing",
		selectedBg: "bg-skill-writing/8",
		checkBg: "bg-skill-writing border-skill-writing",
		checkBorder: "border-skill-writing/40",
		textColor: "text-skill-writing",
	},
	speaking: {
		label: "Nói",
		accent: "bg-skill-speaking",
		selectedBg: "bg-skill-speaking/8",
		checkBg: "bg-skill-speaking border-skill-speaking",
		checkBorder: "border-skill-speaking/40",
		textColor: "text-skill-speaking",
	},
}

const SKILL_ORDER: ExamSkillKey[] = ["listening", "reading", "writing", "speaking"]

export function SectionSelector({ sections, selected, onToggleSection, onToggleSkill }: Props) {
	const grouped = SKILL_ORDER.reduce<Record<ExamSkillKey, ExamSection[]>>(
		(acc, skill) => {
			acc[skill] = sections.filter((s) => s.skill === skill)
			return acc
		},
		{ listening: [], reading: [], writing: [], speaking: [] },
	)

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">Chọn phần luyện tập</h2>
				<p className="text-xs text-muted-foreground">
					{selected.size === 0
						? "Chưa chọn — sẽ làm full test"
						: `${selected.size} phần đã chọn`}
				</p>
			</div>

			{SKILL_ORDER.map((skill) => {
				const skillSections = grouped[skill]
				const meta = SKILL_META[skill]
				const skillIds = skillSections.map((s) => s.id)
				const selectedCount = skillIds.filter((id) => selected.has(id)).length
				const allSelected = selectedCount === skillIds.length && skillIds.length > 0
				const someSelected = selectedCount > 0 && !allSelected

				const totalMinutes = skillSections.reduce((sum, s) => sum + s.durationMinutes, 0)
				const totalCount = skillSections.reduce((sum, s) => sum + s.questionCount, 0)
				const unit = skillSections[0]?.unit ?? "câu"

				return (
					<div key={skill} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
						{/* Skill group header */}
						<div className="flex items-center justify-between px-4 py-3">
							<div className="flex items-center gap-3">
								<div className={cn("h-5 w-1 rounded-full", meta.accent)} />
								<div>
									<span className={cn("text-sm font-semibold", meta.textColor)}>
										{meta.label}
									</span>
									<span className="ml-2 text-xs text-muted-foreground tabular-nums">
										{totalMinutes} phút · {totalCount} {unit}
									</span>
								</div>
							</div>

							<button
								type="button"
								onClick={() => onToggleSkill(skill, skillIds)}
								className={cn(
									"rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
									allSelected
										? cn("text-white", meta.checkBg)
										: someSelected
											? cn(meta.textColor, "bg-muted hover:bg-muted/80")
											: "text-muted-foreground hover:text-foreground hover:bg-muted",
								)}
							>
								{allSelected ? "Bỏ chọn" : "Chọn tất cả"}
							</button>
						</div>

						{/* Section rows */}
						<div className="border-t border-border/50">
							{skillSections.map((section, idx) => {
								const isSelected = selected.has(section.id)
								const isLast = idx === skillSections.length - 1

								return (
									<button
										key={section.id}
										type="button"
										role="checkbox"
										aria-checked={isSelected}
										onClick={() => onToggleSection(section.id)}
										className={cn(
											"flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
											!isLast && "border-b border-border/40",
											isSelected ? meta.selectedBg : "hover:bg-muted/40",
										)}
									>
										{/* Visual checkbox */}
										<div
											className={cn(
												"flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
												isSelected ? meta.checkBg : "border-border",
											)}
										>
											{isSelected && <Check className="size-3 text-white" />}
										</div>

										{/* Label */}
										<div className="flex-1 min-w-0">
											<span className="text-sm font-medium">{section.title}</span>
											<span className="text-sm text-muted-foreground">
												{" "}— {section.description}
											</span>
										</div>

										{/* Meta */}
										<div className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
											<span className="font-medium">
												{section.questionCount} {section.unit}
											</span>
											<span className="ml-2">~{section.durationMinutes} phút</span>
										</div>
									</button>
								)
							})}
						</div>
					</div>
				)
			})}
		</div>
	)
}
