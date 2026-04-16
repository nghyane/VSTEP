import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
	ArrowLeft,
	Briefcase,
	GraduationCap,
	Heart,
	Home,
	Leaf,
	type LucideIcon,
	Sun,
} from "lucide-react"
import { Suspense, useMemo } from "react"
import { Skeleton } from "#/components/ui/skeleton"
import type { VocabTopic } from "#/lib/mock/vocabulary"
import { vocabularyTopicsQueryOptions } from "#/lib/queries/vocabulary"
import { buildQueue, countMastered, queueCounts } from "#/lib/srs/queue"
import { getAllStates } from "#/lib/srs/storage"
import { LEVEL_LABELS, TASK_LABELS, type VstepLevel, type VstepTask } from "#/lib/types/vstep"
import { cn } from "#/lib/utils"

type VocabView = "level" | "task" | "all"

interface Search {
	view: VocabView
}

export const Route = createFileRoute("/_app/luyen-tap/nen-tang/tu-vung/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		view: s.view === "task" ? "task" : s.view === "all" ? "all" : "level",
	}),
	loader: ({ context: { queryClient } }) =>
		queryClient.ensureQueryData(vocabularyTopicsQueryOptions()),
	component: VocabTopicsPage,
})

const ICON_MAP: Record<VocabTopic["iconKey"], LucideIcon> = {
	family: Home,
	sun: Sun,
	briefcase: Briefcase,
	heart: Heart,
	leaf: Leaf,
	graduation: GraduationCap,
}

const VIEWS: { key: VocabView; label: string }[] = [
	{ key: "level", label: "Theo trình độ" },
	{ key: "task", label: "Theo bài thi" },
	{ key: "all", label: "Tất cả" },
]

function VocabTopicsPage() {
	const { view } = Route.useSearch()
	return (
		<div className="mx-auto w-full max-w-5xl">
			<Link
				to="/luyen-tap/nen-tang"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Luyện tập nền tảng
			</Link>
			<div className="mt-4">
				<h1 className="text-3xl font-bold tracking-tight md:text-4xl">Luyện từ vựng</h1>
				<p className="mt-2 text-sm text-muted-foreground md:text-base">
					Học từ theo chủ đề với hệ thống lặp lại cách quãng (SRS) và bài tập vận dụng gắn với
					VSTEP.
				</p>
			</div>
			<div className="mt-6 flex gap-1 rounded-xl bg-muted p-1">
				{VIEWS.map(({ key, label }) => (
					<Link
						key={key}
						to="/luyen-tap/nen-tang/tu-vung"
						search={{ view: key }}
						className={cn(
							"flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
							view === key
								? "bg-card text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{label}
					</Link>
				))}
			</div>
			<Suspense fallback={<TopicGridSkeleton />}>
				{view === "level" && <LevelView />}
				{view === "task" && <TaskView />}
				{view === "all" && <AllView />}
			</Suspense>
		</div>
	)
}

// ─── Level view ────────────────────────────────────────────────

const LEVELS: VstepLevel[] = ["B1", "B2", "C1"]

function LevelView() {
	const { data: topics } = useSuspenseQuery(vocabularyTopicsQueryOptions())
	const grouped = useMemo(() => {
		const map = new Map<VstepLevel, VocabTopic[]>()
		for (const t of topics) {
			const list = map.get(t.level) ?? []
			list.push(t)
			map.set(t.level, list)
		}
		return map
	}, [topics])

	return (
		<div className="mt-8 space-y-10">
			{LEVELS.map((level) => {
				const list = grouped.get(level) ?? []
				if (list.length === 0) return null
				return (
					<section key={level}>
						<div className="mb-4 flex items-baseline gap-2">
							<h2 className="text-lg font-bold">{LEVEL_LABELS[level]}</h2>
							<span className="text-xs text-muted-foreground">{list.length} chủ đề</span>
						</div>
						<TopicGrid topics={list} />
					</section>
				)
			})}
		</div>
	)
}

// ─── Task view ─────────────────────────────────────────────────

const TASKS: VstepTask[] = ["WT1", "WT2", "SP1", "SP2", "SP3", "READ"]

function TaskView() {
	const { data: topics } = useSuspenseQuery(vocabularyTopicsQueryOptions())
	const grouped = useMemo(() => {
		const map = new Map<VstepTask, VocabTopic[]>()
		for (const t of topics) {
			for (const task of t.tasks) {
				const list = map.get(task) ?? []
				list.push(t)
				map.set(task, list)
			}
		}
		return map
	}, [topics])

	return (
		<div className="mt-8 space-y-10">
			{TASKS.map((task) => {
				const list = grouped.get(task) ?? []
				if (list.length === 0) return null
				return (
					<section key={task}>
						<div className="mb-4 flex items-baseline gap-2">
							<h2 className="text-lg font-bold">{TASK_LABELS[task]}</h2>
							<span className="text-xs text-muted-foreground">{list.length} chủ đề</span>
						</div>
						<TopicGrid topics={list} />
					</section>
				)
			})}
		</div>
	)
}

// ─── All view ──────────────────────────────────────────────────

function AllView() {
	const { data: topics } = useSuspenseQuery(vocabularyTopicsQueryOptions())
	return (
		<div className="mt-8">
			<TopicGrid topics={[...topics]} />
		</div>
	)
}

// ─── Shared ────────────────────────────────────────────────────

function TopicGrid({ topics }: { topics: VocabTopic[] }) {
	const now = Date.now()
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{topics.map((topic) => (
				<TopicCard key={topic.id} topic={topic} now={now} />
			))}
		</div>
	)
}

function TopicCard({ topic, now }: { topic: VocabTopic; now: number }) {
	const Icon = ICON_MAP[topic.iconKey]
	const wordIds = topic.words.map((wrd) => wrd.id)
	const states = getAllStates(wordIds)
	const queue = buildQueue(wordIds, states, now)
	const counts = queueCounts(queue)
	const mastered = countMastered(wordIds, states)
	const masteredPct = Math.round((mastered / topic.words.length) * 100)

	return (
		<Link
			to="/luyen-tap/nen-tang/tu-vung/$topicId"
			params={{ topicId: topic.id }}
			search={{ tab: "flashcard" }}
			className="group flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
		>
			<div className="flex items-start gap-3">
				<Icon className="size-6 shrink-0 text-primary" />
				<div className="min-w-0 flex-1">
					<h3 className="truncate text-base font-bold">{topic.name}</h3>
					<p className="text-xs text-muted-foreground">{topic.words.length} từ</p>
				</div>
				{counts.total > 0 && (
					<span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
						{counts.total} đến hạn
					</span>
				)}
			</div>
			<p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{topic.description}</p>
			<div className="mt-4 flex items-center justify-between text-xs">
				<span className="text-muted-foreground">
					{mastered}/{topic.words.length} đã thuộc
				</span>
				<span className={cn("font-semibold", masteredPct > 0 && "text-primary")}>
					{masteredPct}%
				</span>
			</div>
			<div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-primary transition-all"
					style={{ width: `${masteredPct}%` }}
				/>
			</div>
		</Link>
	)
}

function TopicGridSkeleton() {
	return (
		<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: 6 }).map((_, i) => (
				<Skeleton key={i} className="h-44 rounded-2xl" />
			))}
		</div>
	)
}
