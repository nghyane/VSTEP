import { createFileRoute } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"
import { SpeakingResult } from "#/features/grading/components/SpeakingResult"

export const Route = createFileRoute("/_focused/grading/speaking/$submissionId")({
	component: SpeakingGradingPage,
})

function SpeakingGradingPage() {
	const { submissionId } = Route.useParams()

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<div className="flex items-center gap-3 border-b-2 border-border bg-surface px-4 py-2.5 shrink-0">
				<a href="/luyen-tap/noi" className="p-1 hover:opacity-70">
					<Icon name="back" size="xs" className="text-muted" />
				</a>
				<p className="text-sm font-bold text-foreground">Kết quả chấm bài nói</p>
			</div>
			<div className="flex-1 overflow-y-auto">
				<div className="max-w-2xl mx-auto px-4 py-6">
					<SpeakingResult submissionId={submissionId} />
				</div>
			</div>
		</div>
	)
}
