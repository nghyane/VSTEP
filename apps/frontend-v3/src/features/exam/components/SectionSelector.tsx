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

const SKILL_TINT: Record<SkillKey, { bg: string; checkBg: string; border: string; text: string }> = {
	listening: {
		bg: "bg-skill-listening/8",
		checkBg: "bg-skill-listening border-skill-listening",
		border: "border-skill-listening/35",
		text: "text-skill-listening-dark",
	},
	reading: {
		bg: "bg-skill-reading/8",
		checkBg: "bg-skill-reading border-skill-reading",
		border: "border-skill-reading/35",
		text: "text-skill-reading-dark",
	},
	writing: {
		bg: "bg-skill-writing/8",
		checkBg: "bg-skill-writing border-skill-writing",
		border: "border-skill-writing/35",
		text: "text-skill-writing-dark",
	},
	speaking: {
		bg: "bg-skill-speaking/8",
		checkBg: "bg-skill-speaking border-skill-speaking",
		border: "border-skill-speaking/35",
		text: "text-skill-speaking-dark",
	},
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
				const tint = SKILL_TINT[skill]
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
							isSelected && `-translate-y-0.5 ${tint.border}`,
						)}
					>
						<div
							className={cn(
								"flex items-center gap-4 px-5 py-3.5 transition-colors",
								isSelected ? tint.bg : "hover:bg-background/60",
							)}
						>
							<label className="flex cursor-pointer items-center gap-4 flex-1 min-w-0">
								<input
									type="checkbox"
									className="sr-only"
									checked={isSelected}
									onChange={() => onToggleSkill(skill)}
									aria-label={skillDef?.label}
								/>
								<div
									className={cn(
										"flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
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

								{skillDef && <SkillIcon name={skillDef.pngIcon} size="xs" />}
								<span className={cn("text-sm font-bold", tint.text)}>{skillDef?.label}</span>
								<span className="text-xs text-subtle tabular-nums">
									{minutes} phút · {countLabel}
								</span>
							</label>

							<button
								type="button"
								onClick={() => handleToggleExpand(skill)}
								aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
								aria-expanded={isExpanded}
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
						</div>

						{isExpanded && (
							<div className="border-t border-border-light">
								{parts.map((part, idx) => (
									<div
										key={part.id}
										className={cn(
											"flex items-center gap-3 px-5 py-2.5",
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
					</div>
				)
			})}

			{!isAllSelected && selected.size > 0 && (
				<p className="text-xs text-subtle text-center">Chọn tất cả 4 kỹ năng để làm full test</p>
			)}
		</div>
	)
}
