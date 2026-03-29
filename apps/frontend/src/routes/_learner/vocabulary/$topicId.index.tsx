import {
	ArrowLeft01Icon,
	Book02Icon,
	BrainIcon,
	CheckmarkCircle02Icon,
	RepeatIcon,
	VolumeHighIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useTopicProgress, useVocabularyTopic } from "@/hooks/use-vocabulary"
import { cn } from "@/lib/utils"
import type { VocabularyWord } from "@/types/api"

export const Route = createFileRoute("/_learner/vocabulary/$topicId/")({
	component: VocabTopicDetailPage,
})

const posLabels: Record<string, string> = {
	noun: "Danh từ",
	verb: "Động từ",
	adjective: "Tính từ",
	adverb: "Trạng từ",
	phrase: "Cụm từ",
}

const posColors: Record<string, string> = {
	noun: "bg-blue-100 text-blue-700",
	verb: "bg-green-100 text-green-700",
	adjective: "bg-amber-100 text-amber-700",
	adverb: "bg-purple-100 text-purple-700",
	phrase: "bg-rose-100 text-rose-700",
}

interface WordCardProps {
	word: VocabularyWord
}

function WordCard({ word }: WordCardProps) {
	return (
		<div className="space-y-4 rounded-2xl bg-muted/50 p-6 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div className="space-y-1">
					<p className="text-xl font-bold">{word.word}</p>
					{word.phonetic && <p className="text-sm text-muted-foreground">{word.phonetic}</p>}
				</div>
				<div className="flex items-center gap-2">
					<Badge
						variant="secondary"
						className={cn(
							"text-xs",
							posColors[word.partOfSpeech] ?? "bg-muted text-muted-foreground",
						)}
					>
						{posLabels[word.partOfSpeech] ?? word.partOfSpeech}
					</Badge>
					<Button variant="ghost" size="icon-sm" aria-label="Phát âm">
						<HugeiconsIcon icon={VolumeHighIcon} className="size-4" />
					</Button>
				</div>
			</div>

			<div className="space-y-2">
				<p className="text-sm">
					<span className="font-medium text-foreground">EN: </span>
					{word.definition}
				</p>
				{word.explanation && (
					<p className="text-sm">
						<span className="font-medium text-foreground">VI: </span>
						<span className="text-muted-foreground">{word.explanation}</span>
					</p>
				)}
			</div>

			{word.examples.length > 0 && (
				<ul className="space-y-1.5 border-t pt-3">
					{word.examples.map((ex, i) => (
						<li key={i} className="flex gap-2 text-sm text-muted-foreground">
							<span className="shrink-0 text-muted-foreground/60">•</span>
							<span className="italic">{ex}</span>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}

interface StatCardProps {
	icon: typeof Book02Icon
	label: string
	value: number
}

function StatCard({ icon, label, value }: StatCardProps) {
	return (
		<div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
			<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
				<HugeiconsIcon icon={icon} className="size-5" />
			</div>
			<div>
				<p className="text-xl font-bold">{value}</p>
				<p className="text-xs text-muted-foreground">{label}</p>
			</div>
		</div>
	)
}

function VocabTopicDetailPage() {
	const { topicId } = Route.useParams()
	const { data: topic, isLoading, error } = useVocabularyTopic(topicId)
	const { data: progressData } = useTopicProgress(topicId)

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-20 rounded-2xl" />
					))}
				</div>
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-40 rounded-2xl" />
					))}
				</div>
			</div>
		)
	}

	if (error || !topic) {
		return (
			<div className="space-y-6">
				<Link
					to="/vocabulary"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
				>
					<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
					Quay lại
				</Link>
				<div className="py-12 text-center">
					<p className="text-lg font-medium">Không tìm thấy chủ đề</p>
					<p className="mt-1 text-sm text-muted-foreground">
						{error?.message ?? "Chủ đề từ vựng này không tồn tại hoặc đã bị xoá."}
					</p>
					<Button asChild variant="outline" className="mt-4">
						<Link to="/vocabulary">Quay lại danh sách</Link>
					</Button>
				</div>
			</div>
		)
	}

	const totalWords = topic.words.length
	const knownCount = progressData?.knownCount ?? 0

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-2">
					<Link
						to="/vocabulary"
						className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
					>
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						Quay lại
					</Link>
					<h1 className="text-2xl font-bold">{topic.name}</h1>
					<p className="text-sm text-muted-foreground">{topic.description}</p>
				</div>

				<div className="flex gap-2">
					<Button asChild variant="outline">
						<Link to="/vocabulary/$topicId/flashcards" params={{ topicId }}>
							Thẻ ghi nhớ
						</Link>
					</Button>
					<Button asChild>
						<Link to="/vocabulary/$topicId/practice" params={{ topicId }}>
							Luyện điền từ
						</Link>
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<StatCard icon={Book02Icon} label="Tổng số từ" value={totalWords} />
				<StatCard icon={CheckmarkCircle02Icon} label="Đã học" value={knownCount} />
				<StatCard icon={BrainIcon} label="Đã nhớ" value={knownCount} />
				<StatCard
					icon={RepeatIcon}
					label="Cần ôn tập"
					value={Math.max(0, totalWords - knownCount)}
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{topic.words.map((word) => (
					<WordCard key={word.id} word={word} />
				))}
			</div>
		</div>
	)
}
