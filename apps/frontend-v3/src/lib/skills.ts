import type { ComponentType, SVGProps } from "react"
import BookIcon from "#/assets/icons/book-default.svg?react"
import MicIcon from "#/assets/icons/microphone-small.svg?react"
import PencilIcon from "#/assets/icons/pencil-small.svg?react"
import VolumeIcon from "#/assets/icons/volume-small.svg?react"

export type SkillKey = "listening" | "reading" | "writing" | "speaking"

interface SkillConfig {
	label: string
	en: string
	Icon: ComponentType<SVGProps<SVGSVGElement>>
	color: string
	route: string
}

export const SKILL_CONFIG: Record<SkillKey, SkillConfig> = {
	listening: {
		label: "Nghe",
		en: "Listening",
		Icon: VolumeIcon,
		color: "var(--color-skill-listening)",
		route: "/luyen-tap/nghe",
	},
	reading: {
		label: "Đọc",
		en: "Reading",
		Icon: BookIcon,
		color: "var(--color-skill-reading)",
		route: "/luyen-tap/doc",
	},
	writing: {
		label: "Viết",
		en: "Writing",
		Icon: PencilIcon,
		color: "var(--color-skill-writing)",
		route: "/luyen-tap/viet",
	},
	speaking: {
		label: "Nói",
		en: "Speaking",
		Icon: MicIcon,
		color: "var(--color-skill-speaking)",
		route: "/luyen-tap/noi",
	},
}
