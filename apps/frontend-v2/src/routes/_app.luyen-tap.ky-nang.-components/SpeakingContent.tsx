import { useSuspenseQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useMemo } from "react"
import { ExerciseCard, ITEMS_PER_PAGE } from "#/features/practice/components/SkillPageLayout"
import { speakingListQueryOptions } from "#/features/practice/lib/queries-speaking"
import { getSpeakingProgress } from "#/features/practice/lib/speaking-progress"
import { SPEAKING_LEVEL_LABELS, type SpeakingLevel } from "#/mocks/speaking"
import { GridFooter, SkillGrid } from "./SkillGrid"

export function SpeakingContent({
	category,
	page,
	onNavigate,
}: {
	category: string
	page: number
	onNavigate: (u: { category?: string; page?: number }) => void
}) {
	const { data: exercises } = useSuspenseQuery(speakingListQueryOptions())
	const grouped = useMemo(() => {
		const map = new Map<SpeakingLevel, (typeof exercises)[number][]>()
		for (const ex of exercises) {
			const list = map.get(ex.level) ?? []
			list.push(ex)
			map.set(ex.level, list)
		}
		return map
	}, [exercises])
	const progress = useMemo(
		() => Object.fromEntries(exercises.map((ex) => [ex.id, getSpeakingProgress(ex.id)])),
		[exercises],
	)
	const levels: SpeakingLevel[] = ["A2", "B1", "B2", "C1"]
	const activeLevel = (
		levels.includes(category as SpeakingLevel) ? category : "A2"
	) as SpeakingLevel
	const sidebarItems = levels
		.map((lv) => ({
			key: lv,
			label: SPEAKING_LEVEL_LABELS[lv],
			count: (grouped.get(lv) ?? []).length,
		}))
		.filter((i) => i.count > 0)
	const list = grouped.get(activeLevel) ?? []
	const totalPages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE))
	const safePage = Math.min(page, totalPages)
	const items = list.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)
	return (
		<SkillGrid
			sidebarItems={sidebarItems}
			activeKey={activeLevel}
			onSelect={(key) => onNavigate({ category: key, page: 1 })}
			headerLabel={SPEAKING_LEVEL_LABELS[activeLevel]}
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
			<GridFooter
				count={items.length}
				page={safePage}
				totalPages={totalPages}
				onPageChange={(p) => onNavigate({ page: p })}
			/>
		</SkillGrid>
	)
}
