import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, BookOpenText, Headphones, type LucideIcon, Mic, PencilLine } from "lucide-react"
import { Suspense } from "react"
import { ListeningContent } from "#/routes/_app.luyen-tap.ky-nang.-components/ListeningContent"
import { ReadingContent } from "#/routes/_app.luyen-tap.ky-nang.-components/ReadingContent"
import { SpeakingContent } from "#/routes/_app.luyen-tap.ky-nang.-components/SpeakingContent"
import { WritingContent } from "#/routes/_app.luyen-tap.ky-nang.-components/WritingContent"
import { cn } from "#/shared/lib/utils"
import { Skeleton } from "#/shared/ui/skeleton"

type Skill = "nghe" | "doc" | "viet" | "noi"

interface Search {
	skill: Skill
	category: string
	page: number
}

const VALID_SKILLS: Skill[] = ["nghe", "doc", "viet", "noi"]

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		skill: VALID_SKILLS.includes(s.skill as Skill) ? (s.skill as Skill) : "nghe",
		category: typeof s.category === "string" ? s.category : "",
		page: typeof s.page === "number" && s.page >= 1 ? Math.floor(s.page) : 1,
	}),
	component: SkillHubPage,
})

interface SkillTab {
	key: Skill
	label: string
	icon: LucideIcon
	bgClass: string
}

const SKILL_TABS: readonly SkillTab[] = [
	{ key: "nghe", label: "Nghe", icon: Headphones, bgClass: "bg-skill-listening" },
	{ key: "doc", label: "Đọc", icon: BookOpenText, bgClass: "bg-skill-reading" },
	{ key: "noi", label: "Nói", icon: Mic, bgClass: "bg-skill-speaking" },
	{ key: "viet", label: "Viết", icon: PencilLine, bgClass: "bg-skill-writing" },
]

function SkillHubPage() {
	const { skill, category, page } = Route.useSearch()
	const navigate = Route.useNavigate()

	function handleNavigate(update: { category?: string; page?: number }) {
		void navigate({ search: (prev) => ({ ...prev, ...update }) })
	}

	return (
		<div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
			<Link
				to="/luyen-tap"
				search={{ tab: "overview" }}
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Luyện tập
			</Link>

			<h1 className="text-2xl font-bold">Luyện tập kỹ năng</h1>

			<div className="flex gap-2 overflow-x-auto">
				{SKILL_TABS.map((tab) => {
					const Icon = tab.icon
					const active = skill === tab.key
					return (
						<button
							key={tab.key}
							type="button"
							onClick={() => void navigate({ search: { skill: tab.key, category: "", page: 1 } })}
							className={cn(
								"inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-b-4 px-4 py-2.5 text-sm font-bold transition-all",
								active
									? `${tab.bgClass} border-transparent text-white`
									: "border-[oklch(0.88_0.005_260)] border-b-[oklch(0.75_0.01_260)] bg-card text-muted-foreground hover:text-foreground",
							)}
						>
							<Icon className="size-4" />
							{tab.label}
						</button>
					)
				})}
			</div>

			<Suspense fallback={<ListSkeleton />}>
				{skill === "nghe" && (
					<ListeningContent category={category} page={page} onNavigate={handleNavigate} />
				)}
				{skill === "doc" && (
					<ReadingContent category={category} page={page} onNavigate={handleNavigate} />
				)}
				{skill === "viet" && (
					<WritingContent category={category} page={page} onNavigate={handleNavigate} />
				)}
				{skill === "noi" && (
					<SpeakingContent category={category} page={page} onNavigate={handleNavigate} />
				)}
			</Suspense>
		</div>
	)
}

function ListSkeleton() {
	return (
		<div className="grid gap-6 lg:grid-cols-[220px_1fr]">
			<div className="space-y-2">
				{Array.from({ length: 3 }, (_, i) => (
					<Skeleton key={i} className="h-10 rounded-lg" />
				))}
			</div>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{Array.from({ length: 6 }, (_, i) => (
					<Skeleton key={i} className="h-32 rounded-xl" />
				))}
			</div>
		</div>
	)
}
