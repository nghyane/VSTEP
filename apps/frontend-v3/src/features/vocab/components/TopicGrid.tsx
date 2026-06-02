import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useMemo } from "react"
import { ExerciseCard } from "#/features/practice/components/ExerciseCard"
import { LEVELS, toLevel } from "#/features/practice/components/LevelFilters"
import { vocabTopicsQuery } from "#/features/vocab/queries"
import type { VocabTopic } from "#/features/vocab/types"

interface TopicGroup {
	name: string
	description: string
	entry: VocabTopic
	tasks: string[]
	wordCount: number
	learnedCount: number
}

export function TopicGrid() {
	const { data, isLoading } = useQuery(vocabTopicsQuery)

	const topicGroups = useMemo(() => {
		const all = data?.data ?? []
		const groups = new Map<string, TopicGroup>()
		for (const topic of all) {
			const existing = groups.get(topic.name)
			if (!existing) {
				groups.set(topic.name, {
					name: topic.name,
					description: "Chọn chủ đề rồi chọn độ khó ở bên trong.",
					entry: topic,
					tasks: topic.tasks,
					wordCount: topic.word_count ?? 0,
					learnedCount: topic.learned_count ?? 0,
				})
				continue
			}

			existing.entry = earlierTopic(existing.entry, topic)
			existing.tasks = mergeTasks(existing.tasks, topic.tasks)
			existing.wordCount += topic.word_count ?? 0
			existing.learnedCount += topic.learned_count ?? 0
		}

		return Array.from(groups.values()).sort((a, b) => a.entry.display_order - b.entry.display_order)
	}, [data])

	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground">Chủ đề</h3>
			<p className="text-sm text-subtle mt-0.5 mb-4">
				Chọn một chủ đề, sau đó lọc cấp độ trong trang chi tiết
			</p>

			{isLoading || !data ? (
				<p className="text-sm text-subtle">Đang tải...</p>
			) : topicGroups.length === 0 ? (
				<div className="card p-10 text-center">
					<img src="/mascot/lac-think.png" alt="" className="w-24 h-24 mx-auto mb-3 object-contain" />
					<p className="text-sm font-bold text-subtle">Chưa có chủ đề nào</p>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{topicGroups.map((t) => {
						const learned = t.learnedCount
						const total = t.wordCount
						const pct = total > 0 ? Math.round((learned / total) * 100) : 0
						const hasProgress = total > 0 && learned > 0
						return (
							<ExerciseCard
								key={t.name}
								title={t.name}
								description={t.description}
								meta={topicMeta(t)}
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
										params={{ topicId: t.entry.id }}
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

function earlierTopic(a: VocabTopic, b: VocabTopic): VocabTopic {
	const aLevel = levelRank(a.level)
	const bLevel = levelRank(b.level)
	if (aLevel !== bLevel) return aLevel < bLevel ? a : b
	return a.display_order <= b.display_order ? a : b
}

function levelRank(level: string): number {
	const normalized = toLevel(level)
	if (!normalized) return LEVELS.length
	return LEVELS.indexOf(normalized)
}

function mergeTasks(a: string[], b: string[]): string[] {
	const merged = new Set(a)
	for (const task of b) merged.add(task)
	return Array.from(merged)
}

function topicMeta(topic: TopicGroup): string {
	const taskText = topic.tasks.length > 0 ? topic.tasks.join(" · ") : "Từ vựng"
	if (topic.wordCount <= 0) return taskText
	return `${topic.wordCount} từ · ${taskText}`
}
