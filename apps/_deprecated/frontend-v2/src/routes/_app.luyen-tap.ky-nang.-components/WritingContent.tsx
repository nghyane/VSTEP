import { useSuspenseQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useMemo } from "react"
import { ExerciseCard, ITEMS_PER_PAGE } from "#/features/practice/components/SkillPageLayout"
import { writingListQueryOptions } from "#/features/practice/lib/queries-writing"
import { writingSentenceTopicsQueryOptions } from "#/features/practice/lib/queries-writing-sentences"
import { getWritingProgress } from "#/features/practice/lib/writing-progress"
import { WRITING_PART_LABELS, type WritingPart } from "#/mocks/writing"
import { GridFooter, SkillGrid } from "./SkillGrid"

export function WritingContent({
	category,
	page,
	onNavigate,
}: {
	category: string
	page: number
	onNavigate: (u: { category?: string; page?: number }) => void
}) {
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
			accentClass="bg-skill-writing/10 text-skill-writing"
			sidebarItems={sidebarItems}
			activeKey={activeKey}
			onSelect={(key) => onNavigate({ category: key, page: 1 })}
			headerLabel={isSentences ? "Luyện theo câu" : WRITING_PART_LABELS[partNum as WritingPart]}
			totalCount={totalItems}
		>
			{isSentences
				? topics
						.slice(start, start + ITEMS_PER_PAGE)
						.map((topic) => (
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
			<GridFooter
				count={totalItems > 0 ? Math.min(ITEMS_PER_PAGE, totalItems - start) : 0}
				page={safePage}
				totalPages={totalPages}
				onPageChange={(p) => onNavigate({ page: p })}
			/>
		</SkillGrid>
	)
}
