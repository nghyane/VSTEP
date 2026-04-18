import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Suspense } from "react"
import { listeningExerciseQueryOptions } from "#/features/practice/lib/queries-listening"
import { SessionSkeleton } from "./-components/SessionSkeleton"
import { SessionView } from "./-components/SessionView"

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/nghe/$exerciseId/")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(listeningExerciseQueryOptions(params.exerciseId)),
	component: ListeningSessionPage,
})

function ListeningSessionPage() {
	const { exerciseId } = Route.useParams()
	return (
		<div className="mx-auto w-full max-w-3xl">
			<Link
				to="/luyen-tap/ky-nang"
				search={{ skill: "nghe", category: "", page: 1 }}
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Danh sách đề
			</Link>
			<Suspense fallback={<SessionSkeleton />}>
				<SessionView exerciseId={exerciseId} />
			</Suspense>
		</div>
	)
}
