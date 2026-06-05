import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useMemo } from "react"
import { vocabTopicsQuery } from "#/features/vocab/queries"
import {
	groupVocabTopics,
	recommendedProgress,
	type TopicGroup,
	topicFocusLabel,
} from "#/features/vocab/topic-adaptive"

export function TopicGrid() {
	const { data, isLoading } = useQuery(vocabTopicsQuery)

	const topicGroups = useMemo(() => {
		return groupVocabTopics(data?.data ?? [])
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
					{topicGroups.map((topic) => (
						<TopicCard key={topic.key} topic={topic} />
					))}
				</div>
			)}
		</section>
	)
}

interface TopicCardProps {
	topic: TopicGroup
}

function TopicCard({ topic }: TopicCardProps) {
	const focus = recommendedProgress(topic)
	const overallPct = topic.wordCount > 0 ? Math.round((topic.learnedCount / topic.wordCount) * 100) : 0
	const topicComplete = topic.wordCount > 0 && topic.learnedCount >= topic.wordCount
	const focusLabel = topicFocusLabel(focus, topicComplete)

	return (
		<div className="group relative card-interactive flex min-h-44 flex-col overflow-hidden p-5">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-lg font-extrabold text-foreground">{topic.name}</p>
					<p className="mt-1 text-xs text-muted">{topicMeta(topic)}</p>
				</div>
				<span className="rounded-full bg-background px-2.5 py-1 text-xs font-extrabold text-muted tabular-nums">
					{overallPct}%
				</span>
			</div>

			<div className="mt-4">
				<p className="text-xs font-bold text-subtle">{focusLabel}</p>
				<p className="mt-1 text-sm font-bold text-foreground tabular-nums">
					{topicComplete
						? "Ôn lại khi cần"
						: `${focus.level} · ${focusProgressText(focus.learnedCount, focus.wordCount)}`}
				</p>
			</div>

			<div className="mt-auto pt-4">
				<div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted">
					<span>Tổng chủ đề</span>
					<span className="font-bold tabular-nums">
						{topic.learnedCount}/{topic.wordCount} từ
					</span>
				</div>
				<div className="h-1.5 overflow-hidden rounded-full bg-background">
					<div
						className="h-full rounded-full bg-primary transition-all"
						style={{ width: `${overallPct}%` }}
					/>
				</div>
			</div>

			<Link
				to="/luyen-tap/tu-vung/$topicId"
				params={{ topicId: focus.topic.id }}
				className="absolute inset-0 rounded-(--radius-card)"
			/>
		</div>
	)
}

function focusProgressText(learned: number, total: number): string {
	if (total <= 0) return "Chưa có từ"
	if (learned <= 0) return "Chưa học"
	return `${learned}/${total} từ`
}

function topicMeta(topic: TopicGroup): string {
	const levelText = `${topic.levels.length} cấp độ`
	if (topic.wordCount <= 0) return levelText
	return `${topic.wordCount} từ · ${levelText}`
}
