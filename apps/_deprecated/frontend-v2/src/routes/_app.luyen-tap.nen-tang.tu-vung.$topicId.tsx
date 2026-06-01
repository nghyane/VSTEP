import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, BookOpen, Target } from "lucide-react"
import { Suspense } from "react"
import { vocabularyTopicQueryOptions } from "#/features/practice/lib/queries-vocabulary"
import { FlashcardSession } from "#/routes/_app.luyen-tap.nen-tang.tu-vung.-components/FlashcardSession"
import { VocabPracticeSession } from "#/routes/_app.luyen-tap.nen-tang.tu-vung.-components/VocabPracticeSession"
import { cn } from "#/shared/lib/utils"
import { Skeleton } from "#/shared/ui/skeleton"

type Tab = "flashcard" | "practice"

interface Search {
	tab: Tab
}

export const Route = createFileRoute("/_app/luyen-tap/nen-tang/tu-vung/$topicId")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		tab: s.tab === "practice" ? "practice" : "flashcard",
	}),
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(vocabularyTopicQueryOptions(params.topicId)),
	component: StudyPage,
})

function StudyPage() {
	const { topicId } = Route.useParams()
	const { tab } = Route.useSearch()
	return (
		<div className="mx-auto w-full max-w-3xl">
			<Link
				to="/luyen-tap/nen-tang/tu-vung"
				search={{ view: "level" }}
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Tất cả chủ đề
			</Link>
			<Suspense fallback={<StudySkeleton />}>
				<StudyContent topicId={topicId} tab={tab} />
			</Suspense>
		</div>
	)
}

function StudyContent({ topicId, tab }: { topicId: string; tab: Tab }) {
	const { data: topic } = useSuspenseQuery(vocabularyTopicQueryOptions(topicId))
	return (
		<div className="mt-4 space-y-6">
			<header>
				<h1 className="text-2xl font-bold">{topic.name}</h1>
				<p className="text-xs text-muted-foreground">{topic.description}</p>
			</header>
			<TabBar topicId={topicId} tab={tab} />
			{tab === "flashcard" && <FlashcardSession key={topicId} topic={topic} />}
			{tab === "practice" && <VocabPracticeSession key={topicId} topic={topic} />}
		</div>
	)
}

function TabBar({ topicId, tab }: { topicId: string; tab: Tab }) {
	return (
		<div className="flex gap-1 rounded-xl bg-muted p-1">
			{(
				[
					{ key: "flashcard" as Tab, icon: BookOpen, label: "Flashcard" },
					{ key: "practice" as Tab, icon: Target, label: "Luyện tập" },
				] as const
			).map(({ key, icon: Icon, label }) => (
				<Link
					key={key}
					to="/luyen-tap/nen-tang/tu-vung/$topicId"
					params={{ topicId }}
					search={{ tab: key }}
					className={cn(
						"flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
						tab === key
							? "bg-card text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<Icon className="size-4" />
					{label}
				</Link>
			))}
		</div>
	)
}

function StudySkeleton() {
	return (
		<div className="mt-4 space-y-4">
			<Skeleton className="h-8 w-2/3" />
			<Skeleton className="h-12 rounded-xl" />
			<Skeleton className="h-[22rem] w-full rounded-2xl" />
		</div>
	)
}
