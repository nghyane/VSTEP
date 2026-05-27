import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { ExerciseCard } from "#/features/practice/components/ExerciseCard"
import { type Level, LevelFilters } from "#/features/practice/components/LevelFilters"
import { vocabTopicsQuery } from "#/features/vocab/queries"

export function TopicGrid() {
	const { data, isLoading } = useQuery(vocabTopicsQuery)
	const [level, setLevel] = useState<Level | null>(null)

	const topics = useMemo(() => {
		const all = data?.data ?? []
		if (!level) return all
		return all.filter((t) => t.level.toUpperCase() === level)
	}, [data, level])

	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground">Chủ đề</h3>
			<p className="text-sm text-subtle mt-0.5 mb-4">Chọn chủ đề để học từ mới</p>

			<div className="mb-6">
				<LevelFilters level={level} onLevelChange={setLevel} />
			</div>

			{isLoading || !data ? (
				<p className="text-sm text-subtle">Đang tải...</p>
			) : topics.length === 0 ? (
				<div className="card p-10 text-center">
					<img src="/mascot/lac-think.png" alt="" className="w-24 h-24 mx-auto mb-3 object-contain" />
					<p className="text-sm font-bold text-subtle">
						{level ? "Không có chủ đề nào" : "Chưa có chủ đề nào"}
					</p>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{topics.map((t) => {
						const learned = t.learned_count ?? 0
						const total = t.word_count ?? 0
						const pct = total > 0 ? Math.round((learned / total) * 100) : 0
						const hasProgress = total > 0 && learned > 0
						return (
							<ExerciseCard
								key={t.id}
								title={t.name}
								description={t.description}
								level={t.level}
								meta={t.tasks.join(" · ") || "Từ vựng"}
								progress={
									hasProgress
										? {
												status: pct >= 100 ? "completed" : "in_progress",
												score: learned,
												total,
											}
										: undefined
								}

								overlay={
									<Link
										to="/luyen-tap/tu-vung/$topicId"
										params={{ topicId: t.id }}
										className="absolute inset-0 rounded-(--radius-card)"
									/>
								}
							/>
						)
					})}
				</div>
			)}
		</section>
	)
}
