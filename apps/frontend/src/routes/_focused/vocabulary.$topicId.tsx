import { ArrowLeft01Icon, Book02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useVocabularyTopic } from "@/hooks/use-vocabulary"
import { cn } from "@/lib/utils"
import { ChallengeMode } from "@/routes/_learner/vocabulary/-components/ChallengeMode"
import { LearningMode } from "@/routes/_learner/vocabulary/-components/LearningMode"

export const Route = createFileRoute("/_focused/vocabulary/$topicId")({
	component: VocabularyExercisePage,
})

type Mode = "learning" | "challenge"

function VocabularyExercisePage() {
	const { topicId } = Route.useParams()
	const [mode, setMode] = useState<Mode>("learning")
	const { data: topic, isLoading } = useVocabularyTopic(topicId)

	if (isLoading) {
		return (
			<div className="flex h-full flex-col">
				<header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-8 w-24" />
				</header>
				<div className="flex-1 p-6">
					<div className="mx-auto max-w-3xl space-y-4">
						<Skeleton className="h-10 w-full rounded-lg" />
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className="h-16 w-full rounded-xl" />
						))}
					</div>
				</div>
			</div>
		)
	}

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
					<HugeiconsIcon icon={Book02Icon} className="size-5 text-primary" />
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

					{mode === "learning" && <LearningMode topicId={topicId} words={topic.words} />}
					{mode === "challenge" && <ChallengeMode words={topic.words} />}
				</div>
			</div>
		</div>
	)
}
