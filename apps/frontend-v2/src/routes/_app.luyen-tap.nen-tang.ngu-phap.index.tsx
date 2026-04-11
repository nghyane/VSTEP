import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, CheckCircle2, Circle, CircleDot, Sparkles } from "lucide-react"
import { Suspense, useMemo } from "react"
import { Skeleton } from "#/components/ui/skeleton"
import { accuracyPercent, computeLevel, getMastery, type MasteryLevel } from "#/lib/grammar/mastery"
import { CATEGORY_LABELS, type GrammarCategory, type GrammarPoint } from "#/lib/mock/grammar"
import { grammarPointsQueryOptions } from "#/lib/queries/grammar"
import { cn } from "#/lib/utils"

export const Route = createFileRoute("/_app/luyen-tap/nen-tang/ngu-phap/")({
	loader: ({ context: { queryClient } }) =>
		queryClient.ensureQueryData(grammarPointsQueryOptions()),
	component: GrammarListPage,
})

function GrammarListPage() {
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
					Học lý thuyết ngắn gọn rồi làm bài tập trắc nghiệm để củng cố. Hệ thống theo dõi độ thành
					thạo từng điểm ngữ pháp.
				</p>
			</div>
			<Suspense fallback={<ListSkeleton />}>
				<GroupedList />
			</Suspense>
		</div>
	)
}

function GroupedList() {
	const { data: points } = useSuspenseQuery(grammarPointsQueryOptions())

	const grouped = useMemo(() => {
		const map = new Map<GrammarCategory, GrammarPoint[]>()
		for (const point of points) {
			const list = map.get(point.category) ?? []
			list.push(point)
			map.set(point.category, list)
		}
		return map
	}, [points])

	const categories: GrammarCategory[] = [
		"tenses",
		"conditionals",
		"passives",
		"relatives",
		"reported",
		"modals",
	]

	return (
		<div className="mt-8 space-y-10">
			{categories.map((cat) => {
				const list = grouped.get(cat) ?? []
				if (list.length === 0) return null
				return (
					<section key={cat}>
						<div className="mb-4 flex items-baseline gap-2">
							<h2 className="text-lg font-bold">{CATEGORY_LABELS[cat]}</h2>
							<span className="text-xs text-muted-foreground">{list.length} điểm ngữ pháp</span>
						</div>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{list.map((point) => (
								<PointCard key={point.id} point={point} />
							))}
						</div>
					</section>
				)
			})}
		</div>
	)
}

const LEVEL_INFO: Record<MasteryLevel, { label: string; class: string; Icon: typeof Circle }> = {
	new: { label: "Chưa học", class: "text-muted-foreground", Icon: Circle },
	learning: { label: "Đang học", class: "text-skill-speaking", Icon: CircleDot },
	practicing: { label: "Đang luyện", class: "text-skill-reading", Icon: Sparkles },
	mastered: { label: "Đã thuộc", class: "text-primary", Icon: CheckCircle2 },
}

function PointCard({ point }: { point: GrammarPoint }) {
	const mastery = getMastery(point.id)
	const level = computeLevel(mastery)
	const accuracy = accuracyPercent(mastery)
	const info = LEVEL_INFO[level]
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
				<span>{point.exercises.length} câu hỏi</span>
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
