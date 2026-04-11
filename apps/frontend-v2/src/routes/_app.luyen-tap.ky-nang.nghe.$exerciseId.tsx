import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Suspense } from "react"
import { listeningExerciseQueryOptions } from "#/lib/queries/listening"
import { SessionSkeleton } from "./_app.luyen-tap.ky-nang.nghe.$exerciseId.-components/SessionSkeleton"
import { SessionView } from "./_app.luyen-tap.ky-nang.nghe.$exerciseId.-components/SessionView"

export const Route = createFileRoute("/_app/luyen-tap/ky-nang/nghe/$exerciseId")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(listeningExerciseQueryOptions(params.exerciseId)),
	component: ListeningSessionPage,
})

function ListeningSessionPage() {
	const { exerciseId } = Route.useParams()
	return (
		<div className="mx-auto w-full max-w-3xl">
			<Link
				to="/luyen-tap/ky-nang/nghe"
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
