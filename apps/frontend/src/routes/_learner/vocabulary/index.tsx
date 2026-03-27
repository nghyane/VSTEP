import { Book02Icon, CheckmarkCircle02Icon, Fire02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Skeleton } from "@/components/ui/skeleton"
import { useVocabularyTopics } from "@/hooks/use-vocabulary"
import { cn } from "@/lib/utils"
import type { VocabularyTopic } from "@/types/api"
import type { SentenceTopic } from "./-components/sentence-mock-data"
import { SENTENCE_TOPICS } from "./-components/sentence-mock-data"
import { useVocabProgress } from "./-components/use-vocab-progress"

export const Route = createFileRoute("/_learner/vocabulary/")({
	component: VocabularyPage,
})

interface TopicCardProps {
	topic: VocabularyTopic
	learnedCount: number
	weakCount: number
	isPopular: boolean
}

function TopicCard({ topic, learnedCount, weakCount, isPopular }: TopicCardProps) {
	return (
		<Link
			to="/vocabulary/$topicId"
			params={{ topicId: topic.id }}
			className="group flex items-start gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-muted/50"
		>
			<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
				<HugeiconsIcon icon={Book02Icon} className="size-4.5" />
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<div className="flex items-center justify-between">
					<p className="text-sm font-medium">{topic.name}</p>
					{isPopular && (
						<HugeiconsIcon icon={Fire02Icon} className="size-4 shrink-0 text-orange-400" />
					)}
				</div>
				<div className="flex items-center gap-3 text-xs text-muted-foreground">
					<span>{topic.wordCount} từ</span>
					{learnedCount > 0 && (
						<span
							className={cn(
								"flex items-center gap-1",
								learnedCount === topic.wordCount && "text-green-600",
							)}
						>
							<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" />
							{learnedCount} đã học
						</span>
					)}
					{weakCount > 0 && <span className="text-red-500">{weakCount} còn yếu</span>}
				</div>
			</div>
		</Link>
	)
}

interface SentenceTopicCardProps {
	topic: SentenceTopic
}

function SentenceTopicCard({ topic }: SentenceTopicCardProps) {
	return (
		<Link
			to="/vocabulary/sentences/$topicId"
			params={{ topicId: topic.id }}
			className="group flex items-start gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-muted/50"
		>
			<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
				<HugeiconsIcon icon={topic.icon} className="size-4.5" />
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<div className="flex items-center justify-between">
					<p className="text-sm font-medium">{topic.name}</p>
				</div>
				<div className="flex items-center gap-3 text-xs text-muted-foreground">
					<span>{topic.sentenceCount} câu</span>
				</div>
			</div>
		</Link>
	)
}

function VocabularyPage() {
	const progress = useVocabProgress()
	const { data, isLoading, error } = useVocabularyTopics(1, 50)
	const topics = data?.data ?? []
	// First 4 topics as popular
	const popularTopicIds = new Set(topics.slice(0, 4).map((t) => t.id))

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold">Học từ vựng</h1>
					<p className="mt-1 text-muted-foreground">Chọn chủ đề để bắt đầu học</p>
				</div>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<Skeleton key={i} className="h-16 rounded-2xl" />
					))}
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold">Học từ vựng</h1>
					<p className="mt-1 text-muted-foreground">Chọn chủ đề để bắt đầu học</p>
				</div>
				<p className="text-destructive">Lỗi: {error.message}</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Học từ vựng</h1>
				<p className="mt-1 text-muted-foreground">Chọn chủ đề để bắt đầu học</p>
			</div>

			{topics.length > 4 && (
				<section className="space-y-3">
					<div className="flex items-center gap-2">
						<HugeiconsIcon icon={Fire02Icon} className="size-5 text-orange-500" />
						<h2 className="font-semibold">Chủ đề thường gặp</h2>
					</div>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
						{topics.slice(0, 4).map((topic) => {
							const tp = progress[topic.id]
							return (
								<TopicCard
									key={topic.id}
									topic={topic}
									learnedCount={tp?.learned.length ?? 0}
									weakCount={tp?.weak.length ?? 0}
									isPopular
								/>
							)
						})}
					</div>
				</section>
			)}

			<section className="space-y-3">
				<h2 className="font-semibold">Tất cả chủ đề</h2>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{topics.map((topic) => {
						const tp = progress[topic.id]
						return (
							<TopicCard
								key={topic.id}
								topic={topic}
								learnedCount={tp?.learned.length ?? 0}
								weakCount={tp?.weak.length ?? 0}
								isPopular={popularTopicIds.has(topic.id)}
							/>
						)
					})}
				</div>
			</section>

			<div>
				<h1 className="text-2xl font-bold">Luyện theo câu</h1>
				<p className="mt-1 text-muted-foreground">
					Luyện viết câu theo các dạng thường gặp trong bài thi VSTEP Writing
				</p>
			</div>

			<section className="space-y-3">
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{SENTENCE_TOPICS.map((topic) => (
						<SentenceTopicCard key={topic.id} topic={topic} />
					))}
				</div>
			</section>
		</div>
	)
}
