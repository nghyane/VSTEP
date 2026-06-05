import { createFileRoute, Link } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"
import { WritingResult } from "#/features/grading/components/WritingResult"

export const Route = createFileRoute("/_focused/grading/assessment/$attemptId")({
	component: AssessmentGradingPage,
})

function AssessmentGradingPage() {
	const { attemptId } = Route.useParams()

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<div className="flex items-center gap-3 border-b-2 border-border bg-surface px-4 py-2.5 shrink-0">
				<Link to="/luyen-tap/viet" hash="history" className="p-1 hover:opacity-70">
					<Icon name="back" size="xs" className="text-muted" />
				</Link>
				<p className="text-sm font-bold text-foreground">Kết quả AI chấm</p>
			</div>
			<div className="flex-1 overflow-y-auto">
				<div className="max-w-5xl mx-auto px-4 py-6">
					<WritingResult attemptId={attemptId} />
				</div>
			</div>
		</div>
	)
}
