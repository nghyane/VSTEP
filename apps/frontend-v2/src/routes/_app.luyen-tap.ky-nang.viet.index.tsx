import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, PencilLine } from "lucide-react"
import { Suspense, useMemo } from "react"
import {
	ExerciseCard,
	ITEMS_PER_PAGE,
	Pagination,
	SkillSidebar,
} from "#/components/practice/SkillPageLayout"
import { Skeleton } from "#/components/ui/skeleton"
import { WRITING_PART_LABELS, type WritingExercise, type WritingPart } from "#/lib/mock/writing"
import { getWritingProgress } from "#/lib/practice/writing-progress"
import { writingListQueryOptions } from "#/lib/queries/writing"
import { writingSentenceTopicsQueryOptions } from "#/lib/queries/writing-sentences"

type SidebarKey = "part-1" | "part-2" | "sentences"

interface Search {
	section: SidebarKey
	page: number
}

const VALID_SECTIONS: SidebarKey[] = ["part-1", "part-2", "sentences"]

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/viet/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		section: VALID_SECTIONS.includes(s.section as SidebarKey)
			? (s.section as SidebarKey)
			: "part-1",
		page: typeof s.page === "number" && s.page >= 1 ? Math.floor(s.page) : 1,
	}),
	loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(writingListQueryOptions()),
	component: WritingListPage,
})

function WritingListPage() {
	return (
		<div className="mx-auto w-full max-w-6xl space-y-4 pb-10">
			<Link
				to="/luyen-tap/ky-nang"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />4 kỹ năng
			</Link>
			<div className="flex items-center gap-3">
				<PencilLine className="size-7 text-skill-writing" />
				<h1 className="text-xl font-bold">Viết</h1>
			</div>
			<Suspense fallback={<ListSkeleton />}>
				<ListContent />
			</Suspense>
		</div>
	)
}

function ListContent() {
	const { section, page } = Route.useSearch()
	const navigate = Route.useNavigate()
	const { data: exercises } = useSuspenseQuery(writingListQueryOptions())
	const { data: topics } = useSuspenseQuery(writingSentenceTopicsQueryOptions())
	const grouped = groupByPart(exercises)
	const progress = useMemo(
		() => Object.fromEntries(exercises.map((ex) => [ex.id, getWritingProgress(ex.id)])),
		[exercises],
	)

	const sidebarItems = [
		{ key: "part-1" as const, label: WRITING_PART_LABELS[1], count: (grouped.get(1) ?? []).length },
		{ key: "part-2" as const, label: WRITING_PART_LABELS[2], count: (grouped.get(2) ?? []).length },
		{ key: "sentences" as const, label: "Luyện theo câu", count: topics.length },
	].filter((i) => i.count > 0)

	const isSentences = section === "sentences"
	const partNum = section === "part-2" ? 2 : 1
	const currentList = isSentences ? [] : (grouped.get(partNum as WritingPart) ?? [])
	const totalItems = isSentences ? topics.length : currentList.length
	const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
	const safePage = Math.min(page, totalPages)
	const start = (safePage - 1) * ITEMS_PER_PAGE

	return (
		<div className="grid gap-6 lg:grid-cols-[220px_1fr]">
			<SkillSidebar
				items={sidebarItems}
				activeKey={section}
				onSelect={(key) => navigate({ search: { section: key as SidebarKey, page: 1 } })}
				colorClass="bg-skill-writing/10 text-skill-writing"
			/>
			<div className="space-y-6">
				<p className="text-sm font-medium text-muted-foreground">
					{isSentences ? "Luyện theo câu" : WRITING_PART_LABELS[partNum as WritingPart]} · {totalItems} bài
				</p>
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{isSentences
						? topics.slice(start, start + ITEMS_PER_PAGE).map((topic) => (
								<ExerciseCard
									key={topic.id}
									title={topic.name}
									description={`${topic.sentenceCount} câu luyện tập`}
									meta={`${topic.sentenceCount} câu`}
									href={
										<Link
											to="/luyen-tap/ky-nang/viet/cau/$topicId"
											params={{ topicId: topic.id }}
											className="absolute inset-0 rounded-xl"
										/>
									}
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
									href={
										<Link
											to="/luyen-tap/ky-nang/viet/$exerciseId"
											params={{ exerciseId: ex.id }}
											className="absolute inset-0 rounded-xl"
										/>
									}
								/>
							)
						})}
				</div>
				{totalItems === 0 && (
					<p className="py-12 text-center text-sm text-muted-foreground">
						Chưa có bài tập cho phần này.
					</p>
				)}
				<Pagination
					page={safePage}
					totalPages={totalPages}
					onPageChange={(p) => navigate({ search: { section, page: p } })}
				/>
			</div>
		</div>
	)
}

function groupByPart(exercises: readonly WritingExercise[]): Map<WritingPart, WritingExercise[]> {
	const map = new Map<WritingPart, WritingExercise[]>()
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
