import type { IconName } from "#/components/Icon"

export type SkillKey = "listening" | "reading" | "writing" | "speaking"

export interface Skill {
	key: SkillKey
	label: string
	en: string
	desc: string
	icon: IconName
	pngIcon: string
	color: string
	route: string
}

export const skills: readonly Skill[] = [
	{
		key: "listening",
		label: "Nghe",
		en: "Listening",
		desc: "3 phần · nghe hiểu",
		icon: "volume",
		pngIcon: "headphones",
		color: "var(--color-skill-listening)",
		route: "/luyen-tap/nghe",
	},
	{
		key: "reading",
		label: "Đọc",
		en: "Reading",
		desc: "4 đoạn văn · đọc hiểu",
		icon: "book",
		pngIcon: "book",
		color: "var(--color-skill-reading)",
		route: "/luyen-tap/doc",
	},
	{
		key: "writing",
		label: "Viết",
		en: "Writing",
		desc: "Thư + luận · AI chấm",
		icon: "pencil",
		pngIcon: "pencil",
		color: "var(--color-skill-writing)",
		route: "/luyen-tap/viet",
	},
	{
		key: "speaking",
		label: "Nói",
		en: "Speaking",
		desc: "3 phần · ghi âm + AI",
		icon: "mic",
		pngIcon: "microphone",
		color: "var(--color-skill-speaking)",
		route: "/luyen-tap/noi",
	},
]
