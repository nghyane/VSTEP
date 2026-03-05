import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useExamDetail, useExamSession } from "@/hooks/use-exam-session"
import { SessionCompleted } from "./-components/SessionCompleted"
import { SessionInProgress } from "./-components/SessionInProgress"

export const Route = createFileRoute("/_learner/exams/sessions/$sessionId")({
	component: ExamSessionPage,
})

function ExamSessionPage() {
	const { sessionId } = Route.useParams()
	const { data: session, isLoading, error } = useExamSession(sessionId)
	const examQuery = useExamDetail(session?.examId ?? "")

	if (isLoading) {
		return <p className="py-10 text-center text-muted-foreground">Đang tải...</p>
	}

	if (error || !session) {
		return (
			<p className="py-10 text-center text-destructive">
				Lỗi: {error?.message ?? "Không tìm thấy phiên thi"}
			</p>
		)
	}

	const exam = examQuery.data
	const isActive = session.status === "in_progress"

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<Link
				to="/practice"
				className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
			>
				<HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
				Về trang Luyện tập
			</Link>

			{isActive ? (
				<SessionInProgress session={session} sessionId={sessionId} exam={exam ?? null} />
			) : (
				<SessionCompleted session={session} exam={exam ?? null} />
			)}
		</div>
	)
}
