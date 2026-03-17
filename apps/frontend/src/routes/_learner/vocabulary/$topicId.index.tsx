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
import { cn } from "@/lib/utils"
import type { PartOfSpeech, VocabWord } from "./-components/mock-data"
import { getMockTopic } from "./-components/mock-data"
import { useVocabProgress } from "./-components/use-vocab-progress"

export const Route = createFileRoute("/_learner/vocabulary/$topicId/")({
	component: VocabTopicDetailPage,
})

const posLabels: Record<PartOfSpeech, string> = {
	noun: "Danh từ",
	verb: "Động từ",
	adjective: "Tính từ",
	adverb: "Trạng từ",
	phrase: "Cụm từ",
}

const posColors: Record<PartOfSpeech, string> = {
	noun: "bg-blue-100 text-blue-700",
	verb: "bg-green-100 text-green-700",
	adjective: "bg-amber-100 text-amber-700",
	adverb: "bg-purple-100 text-purple-700",
	phrase: "bg-rose-100 text-rose-700",
}

interface WordCardProps {
	word: VocabWord
}

function WordCard({ word }: WordCardProps) {
	return (
		<div className="space-y-4 rounded-2xl border border-border bg-background p-6">
			<div className="flex items-start justify-between gap-3">
				<div className="space-y-1">
					<p className="text-xl font-bold">{word.word}</p>
					<p className="text-sm text-muted-foreground">{word.phonetic}</p>
				</div>
				<div className="flex items-center gap-2">
					<Badge variant="secondary" className={cn("text-xs", posColors[word.partOfSpeech])}>
						{posLabels[word.partOfSpeech]}
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
				<p className="text-sm">
					<span className="font-medium text-foreground">VI: </span>
					<span className="text-muted-foreground">{word.explanation}</span>
				</p>
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
		<div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
			<div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
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
	const topic = getMockTopic(topicId)
	const progress = useVocabProgress()

	if (!topic) {
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
						Chủ đề từ vựng này không tồn tại hoặc đã bị xoá.
					</p>
					<Button asChild variant="outline" className="mt-4">
						<Link to="/vocabulary">Quay lại danh sách</Link>
					</Button>
				</div>
			</div>
		)
	}

	const tp = progress[topicId]
	const totalWords = topic.words.length
	const learnedCount = tp?.learned.length ?? 0
	const weakCount = tp?.weak.length ?? 0
	const memorizedCount = Math.max(0, learnedCount - weakCount)

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
				<StatCard icon={CheckmarkCircle02Icon} label="Đã học" value={learnedCount} />
				<StatCard icon={BrainIcon} label="Đã nhớ" value={memorizedCount} />
				<StatCard icon={RepeatIcon} label="Cần ôn tập" value={weakCount} />
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{topic.words.map((word) => (
					<WordCard key={word.id} word={word} />
				))}
			</div>
		</div>
	)
}
