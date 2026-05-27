import { Link } from "@tanstack/react-router"
import { useMemo } from "react"
import { type GrammarTierGroup, findStarterPoint, groupByTier } from "#/features/grammar/catalog"
import type { GrammarPoint } from "#/features/grammar/types"
import { ExerciseCard } from "#/features/practice/components/ExerciseCard"

interface Props {
	points: GrammarPoint[]
}

export function GrammarCatalog({ points }: Props) {
	const groups = useMemo(() => groupByTier(points), [points])
	const starter = findStarterPoint(points)
	const hasStarted = points.some((p) => p.distinct_correct > 0)

	return (
		<div className="px-10 pb-12 space-y-10">
			{!hasStarted && <GettingStarted starter={starter} />}
			{groups.map((group) => (
				<TierSection key={group.tier.key} group={group} />
			))}
		</div>
	)
}

function GettingStarted({ starter }: { starter: GrammarPoint | null }) {
	return (
		<section className="card p-6 bg-primary-tint border-primary">
			<h2 className="text-xl font-extrabold text-foreground">Ngữ pháp cho VSTEP</h2>
			<p className="text-sm text-muted mt-2 max-w-3xl">
				Ngữ pháp vững thì đọc hiểu, viết, nói đều tốt hơn. Chọn nhóm phù hợp trình độ hiện tại của bạn.
			</p>
			{starter && (
				<Link
					to="/luyen-tap/ngu-phap/$pointId"
					params={{ pointId: starter.id }}
					className="btn btn-primary px-5 py-2.5 text-sm mt-4 inline-block"
				>
					Bắt đầu từ bài đầu tiên
				</Link>
			)}
		</section>
	)
}

function TierSection({ group }: { group: GrammarTierGroup }) {
	const { tier, points } = group
	return (
		<section className="space-y-4">
			<div>
				<p className="text-xs font-extrabold uppercase tracking-wide text-primary">{tier.subtitle}</p>
				<h3 className="font-extrabold text-xl text-foreground mt-1">{tier.title}</h3>
				<p className="text-sm text-muted mt-1">{tier.description}</p>
				<p className="text-xs font-bold text-subtle mt-2">{points.length} chủ điểm</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{points.map((point) => {
					const correct = Math.min(point.distinct_correct, point.exercise_count)
					const progress =
						correct > 0
							? { status: "in_progress" as const, score: correct, total: point.exercise_count }
							: undefined

					return (
						<ExerciseCard
							key={point.id}
							title={point.vietnamese_name || point.name}
							description={point.summary}
							meta={point.vietnamese_name ? point.name : ""}
							progress={progress}
							overlay={
								<Link
									to="/luyen-tap/ngu-phap/$pointId"
									params={{ pointId: point.id }}
									className="absolute inset-0 rounded-(--radius-card)"
								/>
							}
						/>
					)
				})}
			</div>
		</section>
	)
}
