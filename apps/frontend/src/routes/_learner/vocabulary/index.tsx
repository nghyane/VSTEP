import { ArrowRight01Icon, Book02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { VOCAB_TOPICS } from "@/routes/_learner/vocabulary/-components/mock-data"

export const Route = createFileRoute("/_learner/vocabulary/")({
	component: VocabularyPage,
})

function VocabularyPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Học từ vựng</h1>
				<p className="mt-1 text-muted-foreground">Chọn chủ đề để bắt đầu học</p>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{VOCAB_TOPICS.map((topic) => (
					<Link
						key={topic.id}
						to="/vocabulary/$topicId"
						params={{ topicId: topic.id }}
						className="group flex flex-col gap-3 rounded-2xl border p-5 transition-all hover:shadow-md"
					>
						<div className="flex items-start gap-3">
							<div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<HugeiconsIcon icon={topic.icon} className="size-6" />
							</div>
							<div className="flex-1">
								<p className="font-semibold">{topic.name}</p>
								<p className="mt-0.5 text-sm text-muted-foreground">{topic.description}</p>
							</div>
							<HugeiconsIcon
								icon={ArrowRight01Icon}
								className="mt-1 size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
							/>
						</div>
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<HugeiconsIcon icon={Book02Icon} className="size-3.5" />
							<span>{topic.wordCount} từ</span>
						</div>
					</Link>
				))}
			</div>
		</div>
	)
}
