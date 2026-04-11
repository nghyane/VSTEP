import { createFileRoute, Link } from "@tanstack/react-router"
import {
	ArrowLeft,
	BookOpenText,
	Headphones,
	Lightbulb,
	type LucideIcon,
	Mic,
	PencilLine,
} from "lucide-react"
import { useSyncExternalStore } from "react"
import { Label } from "#/components/ui/label"
import { Switch } from "#/components/ui/switch"
import {
	getSupportMode,
	SUPPORT_MODE_STORAGE_KEY,
	setSupportMode,
} from "#/lib/practice/support-mode"
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
	const supportMode = useSupportMode()

	return (
		<div className="mx-auto w-full max-w-5xl">
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

			<SupportModeToggle enabled={supportMode} onToggle={setSupportMode} />

			<div className="mt-6 grid gap-4 md:grid-cols-2">
				{SKILLS.map((skill) => (
					<SkillCard key={skill.key} skill={skill} />
				))}
			</div>
		</div>
	)
}

function SupportModeToggle({
	enabled,
	onToggle,
}: {
	enabled: boolean
	onToggle: (v: boolean) => void
}) {
	return (
		<div className="mt-6 flex items-start gap-4 rounded-2xl bg-muted/50 p-5 shadow-sm">
			<Lightbulb
				className={cn("size-6 shrink-0", enabled ? "text-primary" : "text-muted-foreground")}
			/>
			<div className="min-w-0 flex-1">
				<Label htmlFor="support-mode" className="cursor-pointer text-base font-semibold">
					Bật/tắt chế độ hỗ trợ
				</Label>
				<p className="mt-0.5 text-sm text-muted-foreground">
					Khi bật, hệ thống gợi ý cụm từ và từ vựng trong khi làm bài. Tắt để tự thử sức.
				</p>
			</div>
			<Switch
				id="support-mode"
				checked={enabled}
				onCheckedChange={onToggle}
				aria-label="Chế độ hỗ trợ"
			/>
		</div>
	)
}

function SkillCard({ skill }: { skill: SkillCardData }) {
	const Icon = skill.icon
	return (
		<Link
			to={skill.to}
			className="group flex flex-col gap-4 rounded-2xl bg-muted/50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
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

// ─── Support mode hook ─────────────────────────────────────────────

function useSupportMode(): boolean {
	return useSyncExternalStore(
		subscribeToSupportMode,
		getSupportMode,
		() => false, // SSR default — không có window
	)
}

function subscribeToSupportMode(callback: () => void): () => void {
	function handler(e: StorageEvent) {
		if (e.key === SUPPORT_MODE_STORAGE_KEY) callback()
	}
	window.addEventListener("storage", handler)
	window.addEventListener("vstep:support-mode-change", callback)
	return () => {
		window.removeEventListener("storage", handler)
		window.removeEventListener("vstep:support-mode-change", callback)
	}
}
