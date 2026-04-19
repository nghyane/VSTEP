import type { ComponentType, SVGProps } from "react"
import VolumeIcon from "#/assets/icons/volume-small.svg?react"
import BookIcon from "#/assets/icons/book-default.svg?react"
import PencilIcon from "#/assets/icons/pencil-small.svg?react"
import MicIcon from "#/assets/icons/microphone-small.svg?react"

export type SkillKey = "listening" | "reading" | "writing" | "speaking"

export interface Skill {
	key: SkillKey
	label: string
	en: string
	desc: string
	Icon: ComponentType<SVGProps<SVGSVGElement>>
	color: string
	route: string
}

export const skills: readonly Skill[] = [
	{
		key: "listening",
		label: "Nghe",
		en: "Listening",
		desc: "3 phần · nghe hiểu",
		Icon: VolumeIcon,
		color: "var(--color-skill-listening)",
		route: "/luyen-tap/nghe",
	},
	{
		key: "reading",
		label: "Đọc",
		en: "Reading",
		desc: "4 đoạn văn · đọc hiểu",
		Icon: BookIcon,
		color: "var(--color-skill-reading)",
		route: "/luyen-tap/doc",
	},
	{
		key: "writing",
		label: "Viết",
		en: "Writing",
		desc: "Thư + luận · AI chấm",
		Icon: PencilIcon,
		color: "var(--color-skill-writing)",
		route: "/luyen-tap/viet",
	},
	{
		key: "speaking",
		label: "Nói",
		en: "Speaking",
		desc: "3 phần · ghi âm + AI",
		Icon: MicIcon,
		color: "var(--color-skill-speaking)",
		route: "/luyen-tap/noi",
	},
]

export const skillByKey = Object.fromEntries(skills.map((s) => [s.key, s])) as Record<SkillKey, Skill>
