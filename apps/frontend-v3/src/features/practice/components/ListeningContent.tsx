import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { ExerciseCard } from "#/features/practice/components/ExerciseCard"
import { SkillSidebar } from "#/features/practice/components/SkillSidebar"
import { listeningExercisesQuery } from "#/features/practice/queries"

const PART_LABELS: Record<number, string> = {
	1: "Nghe hiểu ngắn",
	2: "Nghe hiểu hội thoại",
	3: "Nghe hiểu bài giảng",
}

export function ListeningContent() {
	const { data } = useQuery(listeningExercisesQuery)
	const [activePart, setActivePart] = useState("1")

	const exercises = data ? data.data : []

	const grouped = useMemo(() => {
		const map = new Map<number, typeof exercises>()
		for (const ex of exercises) {
			const list = map.get(ex.part) ?? []
			list.push(ex)
			map.set(ex.part, list)
		}
		return map
	}, [exercises])

	const sidebarItems = [1, 2, 3]
		.map((p) => ({ key: String(p), label: PART_LABELS[p] ?? `Part ${p}`, count: grouped.get(p)?.length ?? 0 }))
		.filter((i) => i.count > 0)

	const list = grouped.get(Number(activePart)) ?? []

	if (!data) return <p className="text-muted">Đang tải...</p>

	return (
		<div className="grid gap-6 lg:grid-cols-[220px_1fr]">
			<SkillSidebar items={sidebarItems} activeKey={activePart} onSelect={setActivePart} accentClass="bg-info-tint text-info" />
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<p className="text-sm font-bold text-foreground">{PART_LABELS[Number(activePart)]}</p>
					<p className="text-xs text-subtle">{list.length} bài</p>
				</div>
				{list.length === 0 ? (
					<p className="py-12 text-center text-sm text-subtle">Chưa có bài tập cho phần này.</p>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{list.map((ex) => (
							<ExerciseCard
								key={ex.id}
								title={ex.title}
								description={ex.description}
								meta={ex.estimated_minutes ? `${ex.estimated_minutes} phút` : ""}
								href={<Link to="/listening/$exerciseId" params={{ exerciseId: ex.id }} className="absolute inset-0 rounded-(--radius-card)" />}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
