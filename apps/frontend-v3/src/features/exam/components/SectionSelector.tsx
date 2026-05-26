import { useState } from "react"
import { SkillIcon } from "#/components/SkillIcon"
import { getPartRows, getSkillTotals } from "#/features/exam/section-rows"
import type { ExamDetail, SkillKey } from "#/features/exam/types"
import { skills } from "#/lib/skills"
import { cn } from "#/lib/utils"

interface Props {
	detail: ExamDetail
	selected: Set<SkillKey>
	onToggleSkill: (skill: SkillKey) => void
}

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"]

const SKILL_TINT: Record<SkillKey, { bg: string; checkBg: string; text: string }> = {
	listening: {
		bg: "bg-skill-listening/8",
		checkBg: "bg-skill-listening border-skill-listening",
		text: "text-skill-listening-dark",
	},
	reading: {
		bg: "bg-skill-reading/8",
		checkBg: "bg-skill-reading border-skill-reading",
		text: "text-skill-reading-dark",
	},
	writing: {
		bg: "bg-skill-writing/8",
		checkBg: "bg-skill-writing border-skill-writing",
		text: "text-skill-writing-dark",
	},
	speaking: {
		bg: "bg-skill-speaking/8",
		checkBg: "bg-skill-speaking border-skill-speaking",
		text: "text-skill-speaking-dark",
	},
}

export function SectionSelector({ detail, selected, onToggleSkill }: Props) {
	const [expanded, setExpanded] = useState<Set<SkillKey>>(new Set())

	function handleToggleExpand(skill: SkillKey) {
		setExpanded((prev) => {
			const next = new Set(prev)
			if (next.has(skill)) next.delete(skill)
			else next.add(skill)
			return next
		})
	}

	const statusLabel =
		selected.size === 0 ? "Chưa chọn — sẽ làm full test" : `${selected.size} kỹ năng đã chọn`

	return (
		<div className="space-y-3">
			<div className="card overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between px-5 py-3.5 border-b border-border-light">
					<h2 className="text-sm font-extrabold text-foreground">Chọn cách luyện tập</h2>
					<span className="text-xs text-subtle">{statusLabel}</span>
				</div>

				{/* Skill rows */}
				{SKILL_ORDER.map((skill, rowIdx) => {
					const tint = SKILL_TINT[skill]
					const skillDef = skills.find((s) => s.key === skill)
					const isSelected = selected.has(skill)
					const isExpanded = expanded.has(skill)
					const { minutes, countLabel } = getSkillTotals(skill, detail)
					const parts = getPartRows(skill, detail)
					const isLast = rowIdx === SKILL_ORDER.length - 1

					return (
						<div key={skill}>
							{/* Row header */}
							<label
								className={cn(
									"flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors",
									!isLast && !isExpanded && "border-b border-border-light",
									isSelected && tint.bg,
								)}
							>
								<input
									type="checkbox"
									className="sr-only"
									checked={isSelected}
									onChange={() => onToggleSkill(skill)}
									aria-label={skillDef?.label}
								/>
								<div
									className={cn(
										"flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
										isSelected ? tint.checkBg : "border-border bg-surface",
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

								<div className="flex items-center gap-3 flex-1 min-w-0">
									{skillDef && <SkillIcon name={skillDef.pngIcon} size="xs" />}
									<span className={cn("text-sm font-bold", tint.text)}>{skillDef?.label}</span>
								</div>

								<span className="text-xs text-subtle tabular-nums shrink-0">
									{minutes} phút · {countLabel}
								</span>

								<button
									type="button"
									onClick={(e) => {
										e.preventDefault()
										handleToggleExpand(skill)
									}}
									aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
									className="shrink-0 flex items-center justify-center size-7 rounded-md text-muted hover:text-foreground hover:bg-border-light transition-colors"
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
							</label>

							{/* Expanded detail rows */}
							{isExpanded && (
								<div className="border-t border-border-light">
									{parts.map((part, idx) => (
										<div
											key={part.id}
											className={cn(
												"flex items-center gap-3 pl-12 pr-5 py-2.5",
												idx < parts.length - 1 && "border-b border-border-light",
												isSelected ? tint.bg : "bg-background/30",
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

							{/* Divider after expanded section (if not last) */}
							{isExpanded && !isLast && <div className="border-b border-border-light" />}
						</div>
					)
				})}
			</div>

			{/* Footer prompt */}
			{selected.size > 0 && selected.size < 4 && (
				<p className="text-xs text-subtle text-center">Tip: Chọn tất cả 4 kỹ năng trên để làm full test.</p>
			)}
		</div>
	)
}
