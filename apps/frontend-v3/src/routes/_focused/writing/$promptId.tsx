import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { startWritingSession } from "#/features/practice/actions"
import { WritingInProgress } from "#/features/practice/components/WritingInProgress"
import { WritingPreview } from "#/features/practice/components/WritingPreview"
import { writingPromptDetailQuery } from "#/features/practice/queries"
import { FocusBar } from "#/features/vocab/components/FocusBar"

export const Route = createFileRoute("/_focused/writing/$promptId")({
	component: WritingExercisePage,
})

function WritingExercisePage() {
	const { promptId } = Route.useParams()
	const { data } = useQuery(writingPromptDetailQuery(promptId))
	const [sessionId, setSessionId] = useState<string | null>(null)

	const startMutation = useMutation({
		mutationFn: () => startWritingSession(promptId),
		onSuccess: (res) => setSessionId(res.data.session_id),
	})

	if (!data) {
		return (
			<div className="min-h-screen bg-background flex flex-col">
				<FocusBar backTo="/luyen-tap/viet" current={0} total={0} />
				<div className="flex-1 flex items-center justify-center">
					<p className="text-muted">Đang tải...</p>
				</div>
			</div>
		)
	}

	if (!sessionId) {
		return (
			<WritingPreview
				prompt={data.data}
				starting={startMutation.isPending}
				onStart={() => startMutation.mutate()}
			/>
		)
	}

	return <WritingInProgress prompt={data.data} sessionId={sessionId} />
}
