import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Headphones } from "lucide-react"
import { Suspense, useMemo } from "react"
import {
	ExerciseCard,
	ITEMS_PER_PAGE,
	Pagination,
	SkillSidebar,
} from "#/components/practice/SkillPageLayout"
import { Skeleton } from "#/components/ui/skeleton"
import { type ListeningExercise, type ListeningPart, PART_LABELS } from "#/lib/mock/listening"
import { getListeningProgress } from "#/lib/practice/listening-progress"
import { listeningListQueryOptions } from "#/lib/queries/listening"

interface Search {
	part: ListeningPart
	page: number
}

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/nghe/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		part: ([1, 2, 3] as ListeningPart[]).includes(s.part as ListeningPart)
			? (s.part as ListeningPart)
			: 1,
		page: typeof s.page === "number" && s.page >= 1 ? Math.floor(s.page) : 1,
	}),
	loader: ({ context: { queryClient } }) =>
		queryClient.ensureQueryData(listeningListQueryOptions()),
	component: ListeningListPage,
})

function ListeningListPage() {
	return (
		<div className="mx-auto w-full max-w-6xl space-y-4 pb-10">
			<Link
				to="/luyen-tap/ky-nang"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />4 kỹ năng
			</Link>
			<div className="flex items-center gap-3">
				<Headphones className="size-7 text-skill-listening" />
				<h1 className="text-xl font-bold">Nghe</h1>
			</div>
			<Suspense fallback={<ListSkeleton />}>
				<ListContent />
			</Suspense>
		</div>
	)
}

function ListContent() {
	const { part, page } = Route.useSearch()
	const navigate = Route.useNavigate()
	const { data: exercises } = useSuspenseQuery(listeningListQueryOptions())
	const grouped = groupByPart(exercises)
	const progress = useMemo(
		() => Object.fromEntries(exercises.map((ex) => [ex.id, getListeningProgress(ex.id)])),
		[exercises],
	)
	const parts: ListeningPart[] = [1, 2, 3]

	const sidebarItems = parts
		.map((p) => ({
			key: String(p),
			label: PART_LABELS[p],
			count: (grouped.get(p) ?? []).length,
		}))
		.filter((i) => i.count > 0)

	const currentList = grouped.get(part) ?? []
	const totalPages = Math.max(1, Math.ceil(currentList.length / ITEMS_PER_PAGE))
	const safePage = Math.min(page, totalPages)
	const pageItems = currentList.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

	return (
		<div className="grid gap-6 lg:grid-cols-[220px_1fr]">
			<SkillSidebar
				items={sidebarItems}
				activeKey={String(part)}
				onSelect={(key) =>
					navigate({ search: { part: Number(key) as ListeningPart, page: 1 } })
				}
				colorClass="bg-skill-listening/10 text-skill-listening"
			/>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<p className="text-sm font-medium text-muted-foreground">
						{PART_LABELS[part]} · {currentList.length} bài
					</p>
				</div>
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
								score={p?.score}
								total={ex.items.length}
								href={
									<Link
										to="/luyen-tap/ky-nang/nghe/$exerciseId"
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
						Chưa có bài tập cho phần này.
					</p>
				)}
				<Pagination
					page={safePage}
					totalPages={totalPages}
					onPageChange={(p) => navigate({ search: { part, page: p } })}
				/>
			</div>
		</div>
	)
}

function groupByPart(
	exercises: readonly ListeningExercise[],
): Map<ListeningPart, ListeningExercise[]> {
	const map = new Map<ListeningPart, ListeningExercise[]>()
	for (const ex of exercises) {
		const list = map.get(ex.part) ?? []
		list.push(ex)
		map.set(ex.part, list)
	}
	return map
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
