import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, CheckCircle2, Circle, CircleDot, Sparkles } from "lucide-react"
import { Suspense, useMemo } from "react"
import { Skeleton } from "#/components/ui/skeleton"
import { accuracyPercent, computeLevel, getMastery, type MasteryLevel } from "#/lib/grammar/mastery"
import {
	type GrammarPoint,
	LEVEL_LABELS,
	TASK_LABELS,
	type VstepLevel,
	type VstepTask,
} from "#/lib/mock/grammar"
import { grammarPointsQueryOptions } from "#/lib/queries/grammar"
import { cn } from "#/lib/utils"

type GrammarView = "level" | "task" | "errors"

interface Search {
	view: GrammarView
}

export const Route = createFileRoute("/_app/luyen-tap/nen-tang/ngu-phap/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		view: s.view === "task" ? "task" : s.view === "errors" ? "errors" : "level",
	}),
	loader: ({ context: { queryClient } }) =>
		queryClient.ensureQueryData(grammarPointsQueryOptions()),
	component: GrammarListPage,
})

const VIEWS: { key: GrammarView; label: string }[] = [
	{ key: "level", label: "Theo trình độ" },
	{ key: "task", label: "Theo bài thi" },
	{ key: "errors", label: "Lỗi hay gặp" },
]

function GrammarListPage() {
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
				<h1 className="text-3xl font-bold tracking-tight md:text-4xl">Luyện ngữ pháp</h1>
				<p className="mt-2 text-sm text-muted-foreground md:text-base">
					Học lý thuyết, luyện bài tập đa dạng, và nắm mẹo dùng ngữ pháp đúng trong từng phần thi
					VSTEP.
				</p>
			</div>
			<div className="mt-6 flex gap-1 rounded-xl bg-muted p-1">
				{VIEWS.map(({ key, label }) => (
					<Link
						key={key}
						to="/luyen-tap/nen-tang/ngu-phap"
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
			<Suspense fallback={<ListSkeleton />}>
				{view === "level" && <LevelView />}
				{view === "task" && <TaskView />}
				{view === "errors" && <ErrorsView />}
			</Suspense>
		</div>
	)
}

// ─── Level view ────────────────────────────────────────────────

const LEVELS: VstepLevel[] = ["B1", "B2", "C1"]

function LevelView() {
	const { data: points } = useSuspenseQuery(grammarPointsQueryOptions())

	const grouped = useMemo(() => {
		const map = new Map<VstepLevel, GrammarPoint[]>()
		for (const point of points) {
			const primaryLevel = point.levels[0]
			if (!primaryLevel) continue
			const list = map.get(primaryLevel) ?? []
			list.push(point)
			map.set(primaryLevel, list)
		}
		return map
	}, [points])

	return (
		<div className="mt-8 space-y-10">
			{LEVELS.map((level) => {
				const list = grouped.get(level) ?? []
				if (list.length === 0) return null
				return (
					<section key={level}>
						<div className="mb-4 flex items-baseline gap-2">
							<h2 className="text-lg font-bold">{LEVEL_LABELS[level]}</h2>
							<span className="text-xs text-muted-foreground">{list.length} điểm ngữ pháp</span>
						</div>
						<PointGrid points={list} />
					</section>
				)
			})}
		</div>
	)
}

// ─── Task view ─────────────────────────────────────────────────

const TASKS: VstepTask[] = ["WT1", "WT2", "SP1", "SP2", "SP3", "READ"]

function TaskView() {
	const { data: points } = useSuspenseQuery(grammarPointsQueryOptions())

	const grouped = useMemo(() => {
		const map = new Map<VstepTask, GrammarPoint[]>()
		for (const point of points) {
			for (const task of point.tasks) {
				const list = map.get(task) ?? []
				list.push(point)
				map.set(task, list)
			}
		}
		return map
	}, [points])

	return (
		<div className="mt-8 space-y-10">
			{TASKS.map((task) => {
				const list = grouped.get(task) ?? []
				if (list.length === 0) return null
				return (
					<section key={task}>
						<div className="mb-4 flex items-baseline gap-2">
							<h2 className="text-lg font-bold">{TASK_LABELS[task]}</h2>
							<span className="text-xs text-muted-foreground">{list.length} điểm ngữ pháp</span>
						</div>
						<PointGrid points={list} />
					</section>
				)
			})}
		</div>
	)
}

// ─── Errors view ───────────────────────────────────────────────

function ErrorsView() {
	const { data: points } = useSuspenseQuery(grammarPointsQueryOptions())
	const list = useMemo(() => points.filter((p) => p.commonMistakes.length > 0), [points])

	if (list.length === 0) {
		return <p className="mt-8 text-sm text-muted-foreground">Chưa có nội dung cho mục này.</p>
	}

	return (
		<div className="mt-8">
			<PointGrid points={list} showMistakeCount />
		</div>
	)
}

// ─── Shared ────────────────────────────────────────────────────

function PointGrid({
	points,
	showMistakeCount = false,
}: {
	points: GrammarPoint[]
	showMistakeCount?: boolean
}) {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{points.map((point) => (
				<PointCard key={point.id} point={point} showMistakeCount={showMistakeCount} />
			))}
		</div>
	)
}

const MASTERY_INFO: Record<MasteryLevel, { label: string; class: string; Icon: typeof Circle }> = {
	new: { label: "Chưa học", class: "text-muted-foreground", Icon: Circle },
	learning: { label: "Đang học", class: "text-skill-speaking", Icon: CircleDot },
	practicing: { label: "Đang luyện", class: "text-skill-reading", Icon: Sparkles },
	mastered: { label: "Đã thuộc", class: "text-primary", Icon: CheckCircle2 },
}

function PointCard({
	point,
	showMistakeCount,
}: {
	point: GrammarPoint
	showMistakeCount: boolean
}) {
	const mastery = getMastery(point.id)
	const level = computeLevel(mastery)
	const accuracy = accuracyPercent(mastery)
	const info = MASTERY_INFO[level]
	const LevelIcon = info.Icon

	return (
		<Link
			to="/luyen-tap/nen-tang/ngu-phap/$pointId"
			params={{ pointId: point.id }}
			search={{ tab: "theory" }}
			className="group flex flex-col gap-2 rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<h3 className="truncate text-base font-bold">{point.name}</h3>
					<p className="truncate text-xs text-muted-foreground">{point.vietnameseName}</p>
				</div>
				<span className={cn("flex items-center gap-1 text-xs font-medium", info.class)}>
					<LevelIcon className="size-3.5" />
					{info.label}
				</span>
			</div>
			<p className="line-clamp-2 text-xs text-muted-foreground">{point.summary}</p>
			<div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
				{showMistakeCount ? (
					<span>{point.commonMistakes.length} lỗi thường gặp</span>
				) : (
					<span>{point.exercises.length} bài tập</span>
				)}
				{mastery.attempts > 0 && (
					<span className="tabular-nums">
						{mastery.correct}/{mastery.attempts} · {accuracy}%
					</span>
				)}
			</div>
		</Link>
	)
}

function ListSkeleton() {
	return (
		<div className="mt-8 space-y-8">
			{Array.from({ length: 3 }).map((_, i) => (
				<div key={i}>
					<Skeleton className="mb-4 h-6 w-40" />
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: 3 }).map((__, j) => (
							<Skeleton key={j} className="h-32 rounded-2xl" />
						))}
					</div>
				</div>
			))}
		</div>
	)
}
