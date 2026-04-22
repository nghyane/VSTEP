import { createFileRoute } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"
import { WritingResult } from "#/features/grading/components/WritingResult"

export const Route = createFileRoute("/_focused/grading/writing/$submissionId")({
	component: WritingGradingPage,
})

function WritingGradingPage() {
	const { submissionId } = Route.useParams()

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<div className="flex items-center gap-3 border-b-2 border-border bg-surface px-4 py-2.5 shrink-0">
				<a href="/luyen-tap/viet" className="p-1 hover:opacity-70">
					<Icon name="back" size="xs" className="text-muted" />
				</a>
				<p className="text-sm font-bold text-foreground">Kết quả chấm bài viết</p>
			</div>
			<div className="flex-1 overflow-y-auto">
				<div className="max-w-2xl mx-auto px-4 py-6">
					<WritingResult submissionId={submissionId} backTo="/luyen-tap/viet" />
				</div>
			</div>
		</div>
	)
}
