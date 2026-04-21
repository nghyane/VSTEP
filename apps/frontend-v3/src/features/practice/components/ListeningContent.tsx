import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useMemo } from "react"
import { ExerciseCard } from "#/features/practice/components/ExerciseCard"
import { listeningExercisesQuery } from "#/features/practice/queries"

const PARTS = [
	{ part: 1, label: "Part 1 — Nghe hiểu ngắn", desc: "Nghe đoạn hội thoại ngắn, trả lời câu hỏi" },
	{ part: 2, label: "Part 2 — Nghe hiểu hội thoại", desc: "Nghe hội thoại dài, trả lời câu hỏi chi tiết" },
	{ part: 3, label: "Part 3 — Nghe hiểu bài giảng", desc: "Nghe bài giảng/thuyết trình, trả lời câu hỏi" },
]

export function ListeningContent() {
	const { data } = useQuery(listeningExercisesQuery)
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

	if (!data) return <p className="text-muted">Đang tải...</p>

	return (
		<div className="space-y-8">
			{PARTS.map(({ part, label, desc }) => {
				const list = grouped.get(part) ?? []
				return (
					<section key={part}>
						<h3 className="font-extrabold text-xl text-foreground">{label}</h3>
						<p className="text-sm text-subtle mt-0.5 mb-4">{desc}</p>
						{list.length === 0 ? (
							<div className="card p-6 text-center">
								<p className="text-sm text-subtle">Sắp ra mắt</p>
							</div>
						) : (
							<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
								{list.map((ex) => (
									<ExerciseCard
										key={ex.id}
										title={ex.title}
										description={ex.description}
										meta={ex.estimated_minutes ? `${ex.estimated_minutes} phút` : ""}
										overlay={
											<Link
												to="/listening/$exerciseId"
												params={{ exerciseId: ex.id }}
												className="absolute inset-0 rounded-(--radius-card)"
											/>
										}
									/>
								))}
							</div>
						)}
					</section>
				)
			})}
		</div>
	)
}
