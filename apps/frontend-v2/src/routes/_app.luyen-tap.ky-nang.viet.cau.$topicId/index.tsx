import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Suspense } from "react"
import { writingSentenceTopicQueryOptions } from "#/features/practice/lib/queries-writing-sentences"
import { SentencePracticeSkeleton } from "./-components/SentencePracticeSkeleton"
import { SentencePracticeView } from "./-components/SentencePracticeView"

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/viet/cau/$topicId/")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(writingSentenceTopicQueryOptions(params.topicId)),
	component: WritingSentencePage,
})

function WritingSentencePage() {
	const { topicId } = Route.useParams()
	return (
		<div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
			<Link
				to="/luyen-tap/ky-nang"
				search={{ skill: "viet", category: "", page: 1 }}
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Viết
			</Link>
			<Suspense fallback={<SentencePracticeSkeleton />}>
				<SentencePracticeView topicId={topicId} />
			</Suspense>
		</div>
	)
}
