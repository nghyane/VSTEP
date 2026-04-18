import { useSuspenseQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useMemo } from "react"
import { ExerciseCard, ITEMS_PER_PAGE } from "#/features/practice/components/SkillPageLayout"
import { getListeningProgress } from "#/features/practice/lib/listening-progress"
import { listeningListQueryOptions } from "#/features/practice/lib/queries-listening"
import { PART_LABELS as L_PART_LABELS, type ListeningPart } from "#/mocks/listening"
import { GridFooter, SkillGrid } from "./SkillGrid"

export function ListeningContent({
	category,
	page,
	onNavigate,
}: {
	category: string
	page: number
	onNavigate: (u: { category?: string; page?: number }) => void
}) {
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
			onSelect={(key) => onNavigate({ category: key, page: 1 })}
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
			<GridFooter
				count={items.length}
				page={safePage}
				totalPages={totalPages}
				onPageChange={(p) => onNavigate({ page: p })}
			/>
		</SkillGrid>
	)
}
