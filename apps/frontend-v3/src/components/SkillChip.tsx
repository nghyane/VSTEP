import type { SkillKey } from "#/features/exam/types"
import { cn } from "#/lib/utils"

const SKILL_COLOR: Record<SkillKey, string> = {
	listening: "text-skill-listening",
	reading: "text-skill-reading",
	writing: "text-skill-writing",
	speaking: "text-skill-speaking",
}

const SKILL_LABEL: Record<SkillKey, string> = {
	listening: "Listening",
	reading: "Reading",
	writing: "Writing",
	speaking: "Speaking",
}

const SIZES = {
	sm: "px-2 py-0.5 text-[11px]",
	md: "px-2.5 py-1 text-xs",
} as const

interface Props {
	skill: SkillKey
	size?: keyof typeof SIZES
	label?: string
	className?: string
}

/**
 * Skill identifier chip — rounded pill with tinted background and colored label.
 * Dùng cho mọi chỗ hiển thị "đề này có skill X" (sảnh thi, chi tiết đề, dashboard).
 * Không bao giờ thêm dot/icon bên trong — label một mình đã đủ nhận diện nhờ màu.
 */
export function SkillChip({ skill, size = "sm", label, className }: Props) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full font-extrabold",
				SIZES[size],
				SKILL_COLOR[skill],
				className,
			)}
			style={{ backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)" }}
		>
			{label ?? SKILL_LABEL[skill]}
		</span>
	)
}
