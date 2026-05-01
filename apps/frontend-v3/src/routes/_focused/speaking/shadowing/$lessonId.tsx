import { createFileRoute } from "@tanstack/react-router"
import { ShadowingInProgress } from "#/features/practice/components/ShadowingInProgress"
import { mockShadowingDetails } from "#/features/practice/mock-shadowing"

export const Route = createFileRoute("/_focused/speaking/shadowing/$lessonId")({
	component: ShadowingPage,
})

function ShadowingPage() {
	const { lessonId } = Route.useParams()
	const lesson = mockShadowingDetails[lessonId] ?? null

	if (!lesson) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<p className="text-muted">Không tìm thấy bài học</p>
			</div>
		)
	}

	return <ShadowingInProgress lesson={lesson} />
}
