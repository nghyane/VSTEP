import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, BookOpenText, Headphones, type LucideIcon, Mic, PencilLine } from "lucide-react"
import { Suspense, useMemo } from "react"
import {
	ExerciseCard,
	ITEMS_PER_PAGE,
	Pagination,
	SkillSidebar,
} from "#/components/practice/SkillPageLayout"
import { Skeleton } from "#/components/ui/skeleton"
import { type ListeningPart, PART_LABELS as L_PART_LABELS } from "#/lib/mock/listening"
import { type ReadingPart, READING_PART_LABELS } from "#/lib/mock/reading"
import { type SpeakingLevel, SPEAKING_LEVEL_LABELS } from "#/lib/mock/speaking"
import { WRITING_PART_LABELS, type WritingPart } from "#/lib/mock/writing"
import { getListeningProgress } from "#/lib/practice/listening-progress"
import { getReadingProgress } from "#/lib/practice/reading-progress"
import { getSpeakingProgress } from "#/lib/practice/speaking-progress"
import { getWritingProgress } from "#/lib/practice/writing-progress"
import { listeningListQueryOptions } from "#/lib/queries/listening"
import { readingListQueryOptions } from "#/lib/queries/reading"
import { speakingListQueryOptions } from "#/lib/queries/speaking"
import { writingListQueryOptions } from "#/lib/queries/writing"
import { writingSentenceTopicsQueryOptions } from "#/lib/queries/writing-sentences"
import { cn } from "#/lib/utils"

// ─── Types ─────────────────────────────────────────────────────────

type Skill = "nghe" | "doc" | "viet" | "noi"

interface Search {
	skill: Skill
	category: string
	page: number
}

const VALID_SKILLS: Skill[] = ["nghe", "doc", "viet", "noi"]

// ─── Route ─────────────────────────────────────────────────────────

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		skill: VALID_SKILLS.includes(s.skill as Skill) ? (s.skill as Skill) : "nghe",
		category: typeof s.category === "string" ? s.category : "",
		page: typeof s.page === "number" && s.page >= 1 ? Math.floor(s.page) : 1,
	}),
	component: SkillHubPage,
})

// ─── Skill tabs config ─────────────────────────────────────────────

interface SkillTab {
	key: Skill
	label: string
	icon: LucideIcon
	colorClass: string
	bgClass: string
}

const SKILL_TABS: readonly SkillTab[] = [
	{ key: "nghe", label: "Nghe", icon: Headphones, colorClass: "text-skill-listening", bgClass: "bg-skill-listening" },
	{ key: "doc", label: "Đọc", icon: BookOpenText, colorClass: "text-skill-reading", bgClass: "bg-skill-reading" },
	{ key: "noi", label: "Nói", icon: Mic, colorClass: "text-skill-speaking", bgClass: "bg-skill-speaking" },
	{ key: "viet", label: "Viết", icon: PencilLine, colorClass: "text-skill-writing", bgClass: "bg-skill-writing" },
]

// ─── Page ──────────────────────────────────────────────────────────

function SkillHubPage() {
	const { skill } = Route.useSearch()
	const navigate = Route.useNavigate()

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

			{/* Skill tabs — underline style with skill colors */}
			<div className="flex gap-1 overflow-x-auto border-b">
				{SKILL_TABS.map((tab) => {
					const Icon = tab.icon
					const active = skill === tab.key
					return (
						<button
							key={tab.key}
							type="button"
							onClick={() => navigate({ search: { skill: tab.key, category: "", page: 1 } })}
							className={cn(
								"relative inline-flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
								active
									? tab.colorClass
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							<Icon className="size-4" />
							{tab.label}
							{active && (
								<span
									className={cn(
										"absolute inset-x-0 bottom-0 h-0.5 rounded-full",
										tab.bgClass,
									)}
								/>
							)}
						</button>
					)
				})}
			</div>

			<Suspense fallback={<ListSkeleton />}>
				{skill === "nghe" && <ListeningContent />}
				{skill === "doc" && <ReadingContent />}
				{skill === "viet" && <WritingContent />}
				{skill === "noi" && <SpeakingContent />}
			</Suspense>
		</div>
	)
}

// ─── Listening ─────────────────────────────────────────────────────

function ListeningContent() {
	const { category, page } = Route.useSearch()
	const navigate = Route.useNavigate()
	const { data: exercises } = useSuspenseQuery(listeningListQueryOptions())

	const grouped = useMemo(() => {
		const map = new Map<ListeningPart, (typeof exercises)[number][]>()
		for (const ex of exercises) {
			const list = map.get(ex.part) ?? []
			list.push(ex)
			map.set(ex.part, list)
		}
		return map
	}, [exercises])

	const progress = useMemo(
		() => Object.fromEntries(exercises.map((ex) => [ex.id, getListeningProgress(ex.id)])),
		[exercises],
	)

	const parts: ListeningPart[] = [1, 2, 3]
	const activePart = (Number(category) || 1) as ListeningPart
	const sidebarItems = parts
		.map((p) => ({ key: String(p), label: L_PART_LABELS[p], count: (grouped.get(p) ?? []).length }))
		.filter((i) => i.count > 0)

	const list = grouped.get(activePart) ?? []
	const totalPages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE))
	const safePage = Math.min(page, totalPages)
	const items = list.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

	return (
		<SkillGrid
			sidebarItems={sidebarItems}
			activeKey={String(activePart)}
			onSelect={(key) => navigate({ search: (prev) => ({ ...prev, category: key, page: 1 }) })}
			headerLabel={L_PART_LABELS[activePart]}
			totalCount={list.length}
		>
			{items.map((ex) => {
				const p = progress[ex.id]
				return (
					<ExerciseCard
						key={ex.id}
						title={ex.title}
						description={ex.description}
						meta={`${ex.estimatedMinutes} phút`}
						status={p?.status}
						score={p?.score}
						total={ex.items.length}
						href={<Link to="/luyen-tap/ky-nang/nghe/$exerciseId" params={{ exerciseId: ex.id }} className="absolute inset-0 rounded-xl" />}
					/>
				)
			})}
			<GridFooter
				count={items.length}
				page={safePage}
				totalPages={totalPages}
				onPageChange={(p) => navigate({ search: (prev) => ({ ...prev, page: p }) })}
			/>
		</SkillGrid>
	)
}

// ─── Reading ───────────────────────────────────────────────────────

function ReadingContent() {
	const { category, page } = Route.useSearch()
	const navigate = Route.useNavigate()
	const { data: exercises } = useSuspenseQuery(readingListQueryOptions())

	const grouped = useMemo(() => {
		const map = new Map<ReadingPart, (typeof exercises)[number][]>()
		for (const ex of exercises) {
			const list = map.get(ex.part) ?? []
			list.push(ex)
			map.set(ex.part, list)
		}
		return map
	}, [exercises])

	const progress = useMemo(
		() => Object.fromEntries(exercises.map((ex) => [ex.id, getReadingProgress(ex.id)])),
		[exercises],
	)

	const parts: ReadingPart[] = [1, 2, 3]
	const activePart = (Number(category) || 1) as ReadingPart
	const sidebarItems = parts
		.map((p) => ({ key: String(p), label: READING_PART_LABELS[p], count: (grouped.get(p) ?? []).length }))
		.filter((i) => i.count > 0)

	const list = grouped.get(activePart) ?? []
	const totalPages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE))
	const safePage = Math.min(page, totalPages)
	const items = list.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

	return (
		<SkillGrid
			sidebarItems={sidebarItems}
			activeKey={String(activePart)}
			onSelect={(key) => navigate({ search: (prev) => ({ ...prev, category: key, page: 1 }) })}
			headerLabel={READING_PART_LABELS[activePart]}
			totalCount={list.length}
		>
			{items.map((ex) => {
				const p = progress[ex.id]
				return (
					<ExerciseCard
						key={ex.id}
						title={ex.title}
						description={ex.description}
						meta={`${ex.estimatedMinutes} phút`}
						status={p?.status}
						score={p?.score}
						total={ex.items.length}
						href={<Link to="/luyen-tap/ky-nang/doc/$exerciseId" params={{ exerciseId: ex.id }} className="absolute inset-0 rounded-xl" />}
					/>
				)
			})}
			<GridFooter
				count={items.length}
				page={safePage}
				totalPages={totalPages}
				onPageChange={(p) => navigate({ search: (prev) => ({ ...prev, page: p }) })}
			/>
		</SkillGrid>
	)
}

// ─── Writing ───────────────────────────────────────────────────────

function WritingContent() {
	const { category, page } = Route.useSearch()
	const navigate = Route.useNavigate()
	const { data: exercises } = useSuspenseQuery(writingListQueryOptions())
	const { data: topics } = useSuspenseQuery(writingSentenceTopicsQueryOptions())

	const grouped = useMemo(() => {
		const map = new Map<WritingPart, (typeof exercises)[number][]>()
		for (const ex of exercises) {
			const list = map.get(ex.part) ?? []
			list.push(ex)
			map.set(ex.part, list)
		}
		return map
	}, [exercises])

	const progress = useMemo(
		() => Object.fromEntries(exercises.map((ex) => [ex.id, getWritingProgress(ex.id)])),
		[exercises],
	)

	const activeKey = category || "part-1"
	const sidebarItems = [
		{ key: "part-1", label: WRITING_PART_LABELS[1], count: (grouped.get(1) ?? []).length },
		{ key: "part-2", label: WRITING_PART_LABELS[2], count: (grouped.get(2) ?? []).length },
		{ key: "sentences", label: "Luyện theo câu", count: topics.length },
	].filter((i) => i.count > 0)

	const isSentences = activeKey === "sentences"
	const partNum = activeKey === "part-2" ? 2 : 1
	const currentList = isSentences ? [] : (grouped.get(partNum as WritingPart) ?? [])
	const totalItems = isSentences ? topics.length : currentList.length
	const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
	const safePage = Math.min(page, totalPages)
	const start = (safePage - 1) * ITEMS_PER_PAGE

	return (
		<SkillGrid
			sidebarItems={sidebarItems}
			activeKey={activeKey}
			onSelect={(key) => navigate({ search: (prev) => ({ ...prev, category: key, page: 1 }) })}
			headerLabel={isSentences ? "Luyện theo câu" : WRITING_PART_LABELS[partNum as WritingPart]}
			totalCount={totalItems}
		>
			{isSentences
				? topics.slice(start, start + ITEMS_PER_PAGE).map((topic) => (
						<ExerciseCard
							key={topic.id}
							title={topic.name}
							description={`${topic.sentenceCount} câu luyện tập`}
							meta={`${topic.sentenceCount} câu`}
							href={<Link to="/luyen-tap/ky-nang/viet/cau/$topicId" params={{ topicId: topic.id }} className="absolute inset-0 rounded-xl" />}
						/>
					))
				: currentList.slice(start, start + ITEMS_PER_PAGE).map((ex) => {
						const p = progress[ex.id]
						return (
							<ExerciseCard
								key={ex.id}
								title={ex.title}
								description={ex.description}
								meta={`${ex.minWords}-${ex.maxWords} từ · ${ex.estimatedMinutes} phút`}
								status={p?.status}
								href={<Link to="/luyen-tap/ky-nang/viet/$exerciseId" params={{ exerciseId: ex.id }} className="absolute inset-0 rounded-xl" />}
							/>
						)
					})}
			<GridFooter
				count={totalItems > 0 ? Math.min(ITEMS_PER_PAGE, totalItems - start) : 0}
				page={safePage}
				totalPages={totalPages}
				onPageChange={(p) => navigate({ search: (prev) => ({ ...prev, page: p }) })}
			/>
		</SkillGrid>
	)
}

// ─── Speaking ──────────────────────────────────────────────────────

function SpeakingContent() {
	const { category, page } = Route.useSearch()
	const navigate = Route.useNavigate()
	const { data: exercises } = useSuspenseQuery(speakingListQueryOptions())

	const grouped = useMemo(() => {
		const map = new Map<SpeakingLevel, (typeof exercises)[number][]>()
		for (const ex of exercises) {
			const list = map.get(ex.level) ?? []
			list.push(ex)
			map.set(ex.level, list)
		}
		return map
	}, [exercises])

	const progress = useMemo(
		() => Object.fromEntries(exercises.map((ex) => [ex.id, getSpeakingProgress(ex.id)])),
		[exercises],
	)

	const levels: SpeakingLevel[] = ["A2", "B1", "B2", "C1"]
	const activeLevel = (levels.includes(category as SpeakingLevel) ? category : "A2") as SpeakingLevel
	const sidebarItems = levels
		.map((lv) => ({ key: lv, label: SPEAKING_LEVEL_LABELS[lv], count: (grouped.get(lv) ?? []).length }))
		.filter((i) => i.count > 0)

	const list = grouped.get(activeLevel) ?? []
	const totalPages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE))
	const safePage = Math.min(page, totalPages)
	const items = list.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

	return (
		<SkillGrid
			sidebarItems={sidebarItems}
			activeKey={activeLevel}
			onSelect={(key) => navigate({ search: (prev) => ({ ...prev, category: key, page: 1 }) })}
			headerLabel={SPEAKING_LEVEL_LABELS[activeLevel]}
			totalCount={list.length}
		>
			{items.map((ex) => {
				const p = progress[ex.id]
				return (
					<ExerciseCard
						key={ex.id}
						title={ex.title}
						description={ex.description}
						meta={`${ex.estimatedMinutes} phút`}
						status={p?.status}
						score={p?.shadowingDone}
						total={ex.sentences.length}
						href={<Link to="/luyen-tap/ky-nang/noi/$exerciseId" params={{ exerciseId: ex.id }} className="absolute inset-0 rounded-xl" />}
					/>
				)
			})}
			<GridFooter
				count={items.length}
				page={safePage}
				totalPages={totalPages}
				onPageChange={(p) => navigate({ search: (prev) => ({ ...prev, page: p }) })}
			/>
		</SkillGrid>
	)
}

// ─── Shared layout ─────────────────────────────────────────────────

function SkillGrid({
	sidebarItems,
	activeKey,
	onSelect,
	headerLabel,
	totalCount,
	children,
}: {
	sidebarItems: { key: string; label: string; count: number }[]
	activeKey: string
	onSelect: (key: string) => void
	headerLabel: string
	totalCount: number
	children: React.ReactNode
}) {
	return (
		<div className="grid gap-6 lg:grid-cols-[220px_1fr]">
			<SkillSidebar items={sidebarItems} activeKey={activeKey} onSelect={onSelect} />
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<p className="text-sm font-medium">{headerLabel}</p>
					<p className="text-xs text-muted-foreground">{totalCount} bài</p>
				</div>
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{children}
				</div>
			</div>
		</div>
	)
}

function GridFooter({
	count,
	page,
	totalPages,
	onPageChange,
}: {
	count: number
	page: number
	totalPages: number
	onPageChange: (p: number) => void
}) {
	if (count === 0) {
		return (
			<p className="col-span-full py-12 text-center text-sm text-muted-foreground">
				Chưa có bài tập cho phần này.
			</p>
		)
	}
	if (totalPages <= 1) return null
	return (
		<div className="col-span-full">
			<Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
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
