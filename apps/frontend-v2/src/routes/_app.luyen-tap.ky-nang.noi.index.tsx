import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Mic } from "lucide-react"
import { Suspense, useMemo } from "react"
import {
	ExerciseCard,
	ITEMS_PER_PAGE,
	Pagination,
	SkillSidebar,
} from "#/components/practice/SkillPageLayout"
import { Skeleton } from "#/components/ui/skeleton"
import {
	SPEAKING_LEVEL_LABELS,
	type SpeakingExercise,
	type SpeakingLevel,
} from "#/lib/mock/speaking"
import { speakingListQueryOptions } from "#/lib/queries/speaking"
import { getSpeakingProgress } from "#/lib/practice/speaking-progress"

const LEVELS: readonly SpeakingLevel[] = ["A2", "B1", "B2", "C1"]

interface Search {
	level: SpeakingLevel
	page: number
}

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/noi/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		level: (LEVELS as readonly string[]).includes(s.level as string)
			? (s.level as SpeakingLevel)
			: "A2",
		page: typeof s.page === "number" && s.page >= 1 ? Math.floor(s.page) : 1,
	}),
	loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(speakingListQueryOptions()),
	component: SpeakingListPage,
})

function SpeakingListPage() {
	return (
		<div className="mx-auto w-full max-w-6xl space-y-4 pb-10">
			<Link
				to="/luyen-tap/ky-nang"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />4 kỹ năng
			</Link>
			<div className="flex items-center gap-3">
				<Mic className="size-7 text-skill-speaking" />
				<h1 className="text-xl font-bold">Nói</h1>
			</div>
			<Suspense fallback={<ListSkeleton />}>
				<ListContent />
			</Suspense>
		</div>
	)
}

function ListContent() {
	const { level, page } = Route.useSearch()
	const navigate = Route.useNavigate()
	const { data: exercises } = useSuspenseQuery(speakingListQueryOptions())
	const grouped = groupByLevel(exercises)
	const progress = useMemo(
		() => Object.fromEntries(exercises.map((ex) => [ex.id, getSpeakingProgress(ex.id)])),
		[exercises],
	)

	const sidebarItems = LEVELS
		.map((lv) => ({
			key: lv,
			label: SPEAKING_LEVEL_LABELS[lv],
			count: (grouped.get(lv) ?? []).length,
		}))
		.filter((i) => i.count > 0)

	const currentList = grouped.get(level) ?? []
	const totalPages = Math.max(1, Math.ceil(currentList.length / ITEMS_PER_PAGE))
	const safePage = Math.min(page, totalPages)
	const pageItems = currentList.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

	return (
		<div className="grid gap-6 lg:grid-cols-[220px_1fr]">
			<SkillSidebar
				items={sidebarItems}
				activeKey={level}
				onSelect={(key) =>
					navigate({ search: { level: key as SpeakingLevel, page: 1 } })
				}
				colorClass="bg-skill-speaking/10 text-skill-speaking"
			/>
			<div className="space-y-6">
				<p className="text-sm font-medium text-muted-foreground">
					{SPEAKING_LEVEL_LABELS[level]} · {currentList.length} bài
				</p>
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{pageItems.map((ex) => {
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
								href={
									<Link
										to="/luyen-tap/ky-nang/noi/$exerciseId"
										params={{ exerciseId: ex.id }}
										className="absolute inset-0 rounded-xl"
									/>
								}
							/>
						)
					})}
				</div>
				{pageItems.length === 0 && (
					<p className="py-12 text-center text-sm text-muted-foreground">
						Chưa có bài tập cho cấp độ này.
					</p>
				)}
				<Pagination
					page={safePage}
					totalPages={totalPages}
					onPageChange={(p) => navigate({ search: { level, page: p } })}
				/>
			</div>
		</div>
	)
}

function groupByLevel(
	exercises: readonly SpeakingExercise[],
): Map<SpeakingLevel, SpeakingExercise[]> {
	const map = new Map<SpeakingLevel, SpeakingExercise[]>()
	for (const ex of exercises) {
		const list = map.get(ex.level) ?? []
		list.push(ex)
		map.set(ex.level, list)
	}
	return map
}

function ListSkeleton() {
	return (
		<div className="grid gap-6 lg:grid-cols-[220px_1fr]">
			<div className="space-y-2">
				{Array.from({ length: 4 }, (_, i) => (
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
