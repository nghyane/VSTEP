import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Suspense } from "react"
import { speakingExerciseQueryOptions } from "#/lib/queries/speaking"
import { SessionSkeleton } from "./-components/SessionSkeleton"
import { SessionView } from "./-components/SessionView"

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/noi/$exerciseId/")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(speakingExerciseQueryOptions(params.exerciseId)),
	component: SpeakingSessionPage,
})

function SpeakingSessionPage() {
	const { exerciseId } = Route.useParams()
	return (
		<div className="mx-auto w-full max-w-3xl">
			<Link
				to="/luyen-tap/ky-nang/noi"
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
