import { Book02Icon, HeadphonesIcon, Mic01Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import type { ChartConfig } from "@/components/ui/chart"
import type { Skill } from "@/types/api"

export const SKILLS: { key: Skill; label: string; icon: IconSvgElement }[] = [
	{ key: "listening", label: "Listening", icon: HeadphonesIcon },
	{ key: "reading", label: "Reading", icon: Book02Icon },
	{ key: "writing", label: "Writing", icon: PencilEdit02Icon },
	{ key: "speaking", label: "Speaking", icon: Mic01Icon },
]

export const SKILL_COLORS: Record<Skill, string> = {
	listening: "var(--skill-listening)",
	reading: "var(--skill-reading)",
	writing: "var(--skill-writing)",
	speaking: "var(--skill-speaking)",
}

export const skillColor: Record<Skill, string> = {
	listening: "bg-skill-listening/15 text-skill-listening",
	reading: "bg-skill-reading/15 text-skill-reading",
	writing: "bg-skill-writing/15 text-skill-writing",
	speaking: "bg-skill-speaking/15 text-skill-speaking",
}

export const skillColorText: Record<Skill, string> = {
	listening: "text-skill-listening",
	reading: "text-skill-reading",
	writing: "text-skill-writing",
	speaking: "text-skill-speaking",
}

export const scoreChartConfig = {
	listening: { label: "Listening", color: "var(--skill-listening)" },
	reading: { label: "Reading", color: "var(--skill-reading)" },
	writing: { label: "Writing", color: "var(--skill-writing)" },
	speaking: { label: "Speaking", color: "var(--skill-speaking)" },
} satisfies ChartConfig
