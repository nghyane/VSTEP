import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, BookOpenText } from "lucide-react"
import { Suspense } from "react"
import {
	ExerciseCard,
	ITEMS_PER_PAGE,
	Pagination,
	SkillSidebar,
} from "#/components/practice/SkillPageLayout"
import { Skeleton } from "#/components/ui/skeleton"
import { READING_PART_LABELS, type ReadingExercise, type ReadingPart } from "#/lib/mock/reading"
import { readingListQueryOptions } from "#/lib/queries/reading"

interface Search {
	part: ReadingPart
	page: number
}

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/doc/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		part: ([1, 2, 3] as ReadingPart[]).includes(s.part as ReadingPart)
			? (s.part as ReadingPart)
			: 1,
		page: typeof s.page === "number" && s.page >= 1 ? Math.floor(s.page) : 1,
	}),
	loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(readingListQueryOptions()),
	component: ReadingListPage,
})

function ReadingListPage() {
	return (
		<div className="mx-auto w-full max-w-6xl space-y-4 pb-10">
			<Link
				to="/luyen-tap/ky-nang"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />4 kỹ năng
			</Link>
			<div className="flex items-center gap-3">
				<BookOpenText className="size-7 text-skill-reading" />
				<h1 className="text-xl font-bold">Đọc</h1>
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
	const { data: exercises } = useSuspenseQuery(readingListQueryOptions())
	const grouped = groupByPart(exercises)
	const parts: ReadingPart[] = [1, 2, 3]

	const sidebarItems = parts
		.map((p) => ({
			key: String(p),
			label: READING_PART_LABELS[p],
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
					navigate({ search: { part: Number(key) as ReadingPart, page: 1 } })
				}
				colorClass="bg-skill-reading/10 text-skill-reading"
			/>
			<div className="space-y-6">
				<p className="text-sm font-medium text-muted-foreground">
					{READING_PART_LABELS[part]} · {currentList.length} bài
				</p>
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{pageItems.map((ex) => (
						<ExerciseCard
							key={ex.id}
							title={ex.title}
							description={ex.description}
							meta={`${ex.items.length} câu · ${ex.estimatedMinutes} phút`}
							href={
								<Link
									to="/luyen-tap/ky-nang/doc/$exerciseId"
									params={{ exerciseId: ex.id }}
									className="absolute inset-0 rounded-xl"
								/>
							}
						/>
					))}
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

function groupByPart(exercises: readonly ReadingExercise[]): Map<ReadingPart, ReadingExercise[]> {
	const map = new Map<ReadingPart, ReadingExercise[]>()
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
