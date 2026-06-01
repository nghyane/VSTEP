import { createFileRoute, Link } from "@tanstack/react-router"
import { useSubmission } from "@/hooks/use-submissions"
import { WritingGradingResult } from "@/routes/_focused/-components/writing/WritingGradingResult"
import type { WritingContent } from "@/types/api"

export const Route = createFileRoute("/_learner/submissions/$id/writing")({
	component: WritingSubmissionDetailPage,
})

function isWritingContent(value: unknown): value is WritingContent {
	return !!value && typeof value === "object" && "prompt" in value
}

function WritingSubmissionDetailPage() {
	const { id } = Route.useParams()
	const { data, isLoading, isError } = useSubmission(id)

	if (isLoading) {
		return <div className="h-[70vh] animate-pulse rounded-2xl bg-muted" />
	}

	if (isError || !data || data.skill !== "writing") {
		return (
			<div className="space-y-4">
				<Link to="/submissions" className="text-sm text-muted-foreground hover:text-foreground">
					← Lịch sử bài nộp
				</Link>
				<p className="text-sm text-destructive">Không thể tải dữ liệu bài viết.</p>
			</div>
		)
	}

	const submittedText = data.answer && "text" in data.answer ? data.answer.text : ""
	const writingContent = isWritingContent(data.question?.content) ? data.question.content : null
	const writingTier = data.practiceSession?.config?.writingTier

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Link
					to="/submissions"
					className="inline-flex text-sm text-muted-foreground hover:text-foreground"
				>
					← Quay lại
				</Link>
			</div>

			<div className="overflow-hidden rounded-2xl border border-border bg-background">
				<WritingGradingResult
					submission={data}
					submittedText={submittedText}
					content={writingContent}
					tier={writingTier}
				/>
			</div>
		</div>
	)
}
