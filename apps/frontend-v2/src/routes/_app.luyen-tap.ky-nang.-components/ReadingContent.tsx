import { useSuspenseQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useMemo } from "react"
import { ExerciseCard, ITEMS_PER_PAGE } from "#/features/practice/components/SkillPageLayout"
import { readingListQueryOptions } from "#/features/practice/lib/queries-reading"
import { getReadingProgress } from "#/features/practice/lib/reading-progress"
import { READING_PART_LABELS, type ReadingPart } from "#/mocks/reading"
import { GridFooter, SkillGrid } from "./SkillGrid"

export function ReadingContent({
	category,
	page,
	onNavigate,
}: {
	category: string
	page: number
	onNavigate: (u: { category?: string; page?: number }) => void
}) {
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
		.map((p) => ({
			key: String(p),
			label: READING_PART_LABELS[p],
			count: (grouped.get(p) ?? []).length,
		}))
		.filter((i) => i.count > 0)
	const list = grouped.get(activePart) ?? []
	const totalPages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE))
	const safePage = Math.min(page, totalPages)
	const items = list.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)
	return (
		<SkillGrid
			accentClass="bg-skill-reading/10 text-skill-reading"
			sidebarItems={sidebarItems}
			activeKey={String(activePart)}
			onSelect={(key) => onNavigate({ category: key, page: 1 })}
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
						href={
							<Link
								to="/luyen-tap/ky-nang/doc/$exerciseId"
								params={{ exerciseId: ex.id }}
								className="absolute inset-0 rounded-xl"
							/>
						}
					/>
				)
			})}
			<GridFooter
				count={items.length}
				page={safePage}
				totalPages={totalPages}
				onPageChange={(p) => onNavigate({ page: p })}
			/>
		</SkillGrid>
	)
}
