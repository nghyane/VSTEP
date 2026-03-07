import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChallengeMode } from "@/routes/_learner/vocabulary/-components/ChallengeMode"
import { LearningMode } from "@/routes/_learner/vocabulary/-components/LearningMode"
import { VOCAB_TOPICS } from "@/routes/_learner/vocabulary/-components/mock-data"

export const Route = createFileRoute("/_focused/vocabulary/$topicId")({
	component: VocabularyExercisePage,
})

type Mode = "learning" | "challenge"

function VocabularyExercisePage() {
	const { topicId } = Route.useParams()
	const [mode, setMode] = useState<Mode>("learning")

	const topic = VOCAB_TOPICS.find((t) => t.id === topicId)

	if (!topic) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<p className="text-muted-foreground">Không tìm thấy chủ đề.</p>
				<Button variant="outline" asChild>
					<Link to="/vocabulary">Quay lại</Link>
				</Button>
			</div>
		)
	}

	return (
		<div className="flex h-full flex-col">
			<header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
				<div className="flex items-center gap-2">
					<HugeiconsIcon icon={topic.icon} className="size-5 text-primary" />
					<span className="text-sm font-semibold">{topic.name}</span>
				</div>
				<Button variant="ghost" size="sm" asChild>
					<Link to="/vocabulary">
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						Quay lại
					</Link>
				</Button>
			</header>

			<div className="flex-1 overflow-y-auto">
				<div className="mx-auto max-w-3xl space-y-6 p-6">
					<div className="flex gap-1 rounded-lg bg-muted/50 p-1">
						<button
							type="button"
							className={cn(
								"flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
								mode === "learning"
									? "bg-background shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={() => setMode("learning")}
						>
							Học từ vựng
						</button>
						<button
							type="button"
							className={cn(
								"flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
								mode === "challenge"
									? "bg-background shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={() => setMode("challenge")}
						>
							Luyện tập
						</button>
					</div>

					{mode === "learning" && <LearningMode words={topic.words} />}
					{mode === "challenge" && <ChallengeMode words={topic.words} />}
				</div>
			</div>
		</div>
	)
}
