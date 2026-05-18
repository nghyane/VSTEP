import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ShadowingInProgress } from "#/features/practice/components/ShadowingInProgress"
import { shadowingLessonDetailQuery } from "#/features/practice/queries"

export const Route = createFileRoute("/_focused/speaking/shadowing/$lessonId")({
	component: ShadowingPage,
})

function ShadowingPage() {
	const { lessonId } = Route.useParams()
	const { data } = useSuspenseQuery(shadowingLessonDetailQuery(lessonId))
	const lesson = data?.data ?? null

	if (!lesson) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<p className="text-muted">Không tìm thấy bài học</p>
			</div>
		)
	}

	return <ShadowingInProgress lesson={lesson} />
}
