import { Link } from "@tanstack/react-router"
import type { VocabTopic, WordWithState } from "#/features/vocab/types"

interface Props {
	topic: VocabTopic
	words: WordWithState[]
	topicId: string
}

export function TopicHero({ topic, words, topicId }: Props) {
	const newCount = words.filter((w) => w.state.kind === "new").length
	const learnedCount = words.length - newCount

	return (
		<section className="card p-6 text-center">
			<span className="text-xs font-bold text-primary bg-primary-tint px-2.5 py-1 rounded-full">
				{topic.level}
			</span>
			<h2 className="font-extrabold text-2xl text-foreground mt-3">{topic.name}</h2>
			{topic.description && <p className="text-sm text-muted mt-1">{topic.description}</p>}
			<div className="flex items-center gap-3 mt-5 max-w-xs mx-auto">
				<div className="flex-1 h-2.5 bg-background rounded-full overflow-hidden">
					<div
						className="h-full bg-primary rounded-full transition-all"
						style={{ width: `${words.length ? (learnedCount / words.length) * 100 : 0}%` }}
					/>
				</div>
				<span className="text-xs font-bold text-muted">
					{learnedCount}/{words.length}
				</span>
			</div>
			<Link
				to="/vocab/$topicId/flashcard"
				params={{ topicId }}
				className="btn btn-primary px-10 py-3.5 text-base mt-6"
			>
				Học Flashcard · {words.length} từ
			</Link>
		</section>
	)
}
