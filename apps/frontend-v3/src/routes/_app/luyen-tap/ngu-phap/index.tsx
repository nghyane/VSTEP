import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { Header } from "#/components/Header"
import { grammarPointsQuery } from "#/features/grammar/queries"
import type { GrammarPoint } from "#/features/grammar/types"
import { ExerciseCard } from "#/features/practice/components/ExerciseCard"
import { type Level, LevelFilters } from "#/features/practice/components/LevelFilters"

export const Route = createFileRoute("/_app/luyen-tap/ngu-phap/")({
	component: GrammarPage,
})

function GrammarPage() {
	const { data } = useQuery(grammarPointsQuery)
	const [level, setLevel] = useState<Level | null>(null)

	const points = data?.data ?? []

	const filtered = useMemo(() => {
		if (!level) return points
		return points.filter((p) => p.levels.some((lv) => lv.toUpperCase() === level))
	}, [points, level])

	const grouped = groupByCategory(filtered)

	return (
		<>
			<Header title="Ngữ pháp" backTo="/luyen-tap" />
			<div className="px-10 pb-12 space-y-6">
				<p className="text-sm text-subtle">Cấu trúc câu theo level · Luyện tập + VSTEP tips</p>

				<LevelFilters level={level} onLevelChange={setLevel} />

				{filtered.length === 0 ? (
					<div className="card p-10 text-center">
						<img src="/mascot/lac-think.png" alt="" className="w-24 h-24 mx-auto mb-3 object-contain" />
						<p className="text-sm font-bold text-subtle">Chưa có bài ngữ pháp nào</p>
					</div>
				) : (
					grouped.map(([category, items]) => (
						<CategorySection key={category} category={category} points={items} />
					))
				)}
			</div>
		</>
	)
}

function CategorySection({ category, points }: { category: string; points: GrammarPoint[] }) {
	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground">{category}</h3>
			<p className="text-sm text-subtle mt-0.5 mb-4">{points.length} điểm ngữ pháp</p>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{points.map((p) => (
					<ExerciseCard
						key={p.id}
						title={p.name}
						description={p.summary}
						level={p.levels[0] ?? undefined}
						meta={[...p.tasks, ...p.functions].filter(Boolean).join(" · ") || "Ngữ pháp"}
						overlay={
							<Link
								to="/luyen-tap/ngu-phap/$pointId"
								params={{ pointId: p.id }}
								className="absolute inset-0 rounded-(--radius-card)"
							/>
						}
					/>
				))}
			</div>
		</section>
	)
}

function groupByCategory(points: GrammarPoint[]): [string, GrammarPoint[]][] {
	const map = new Map<string, GrammarPoint[]>()
	for (const p of points) {
		const cat = p.category ?? "Khác"
		const list = map.get(cat)
		if (list) list.push(p)
		else map.set(cat, [p])
	}
	return Array.from(map.entries())
}
