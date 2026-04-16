import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, BookOpenText, Headphones, type LucideIcon, Mic, PencilLine } from "lucide-react"
import { cn } from "#/lib/utils"

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/")({
	component: KyNangHubPage,
})

type SkillKey = "listening" | "reading" | "writing" | "speaking"

type SkillRoute =
	| "/luyen-tap/ky-nang/nghe"
	| "/luyen-tap/ky-nang/doc"
	| "/luyen-tap/ky-nang/viet"
	| "/luyen-tap/ky-nang/noi"

interface SkillCardData {
	key: SkillKey
	icon: LucideIcon
	label: string
	englishLabel: string
	description: string
	to: SkillRoute
	colorClass: string
}

const SKILLS: readonly SkillCardData[] = [
	{
		key: "listening",
		icon: Headphones,
		label: "Nghe",
		englishLabel: "Listening",
		description: "3 phần · Hội thoại, bài giảng, nghe hiểu dài",
		to: "/luyen-tap/ky-nang/nghe",
		colorClass: "text-skill-listening",
	},
	{
		key: "reading",
		icon: BookOpenText,
		label: "Đọc",
		englishLabel: "Reading",
		description: "4 phần · Đọc hiểu, điền từ, nối đoạn",
		to: "/luyen-tap/ky-nang/doc",
		colorClass: "text-skill-reading",
	},
	{
		key: "writing",
		icon: PencilLine,
		label: "Viết",
		englishLabel: "Writing",
		description: "2 phần · Viết thư, bài luận",
		to: "/luyen-tap/ky-nang/viet",
		colorClass: "text-skill-writing",
	},
	{
		key: "speaking",
		icon: Mic,
		label: "Nói",
		englishLabel: "Speaking",
		description: "3 phần · Giao tiếp, giải pháp, chủ đề",
		to: "/luyen-tap/ky-nang/noi",
		colorClass: "text-skill-speaking",
	},
]

function KyNangHubPage() {
	return (
		<div className="mx-auto w-full max-w-5xl pb-10">
			<Link
				to="/luyen-tap"
				search={{ tab: "overview" }}
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Chọn chế độ luyện tập
			</Link>
			<div className="mt-4">
				<h1 className="text-2xl font-bold">Luyện tập 4 kỹ năng</h1>
				<p className="mt-1 text-sm text-muted-foreground">Chọn kỹ năng bạn muốn luyện đề.</p>
			</div>

			<div className="mt-6 grid gap-4 md:grid-cols-2">
				{SKILLS.map((skill) => (
					<SkillCard key={skill.key} skill={skill} />
				))}
			</div>
		</div>
	)
}

function SkillCard({ skill }: { skill: SkillCardData }) {
	const Icon = skill.icon
	return (
		<Link
			to={skill.to}
			className="group flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
		>
			<Icon className={cn("size-10", skill.colorClass)} />
			<div>
				<h2 className="text-xl font-bold">{skill.label}</h2>
				<p className="text-xs text-muted-foreground">{skill.englishLabel}</p>
			</div>
			<p className="text-sm text-muted-foreground">{skill.description}</p>
		</Link>
	)
}
