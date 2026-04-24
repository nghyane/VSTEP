import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { startVstepSpeakingSession } from "#/features/practice/actions"
import { VstepSpeakingInProgress } from "#/features/practice/components/VstepSpeakingInProgress"
import { VstepSpeakingPreview } from "#/features/practice/components/VstepSpeakingPreview"
import { speakingTaskDetailQuery } from "#/features/practice/queries"
import { FocusBar } from "#/features/vocab/components/FocusBar"

export const Route = createFileRoute("/_focused/speaking/task/$taskId")({
	component: VstepSpeakingPage,
})

function VstepSpeakingPage() {
	const { taskId } = Route.useParams()
	const { data } = useQuery(speakingTaskDetailQuery(taskId))
	const [sessionId, setSessionId] = useState<string | null>(null)

	const startMutation = useMutation({
		mutationFn: () => startVstepSpeakingSession(taskId),
		onSuccess: (res) => setSessionId(res.data.session_id),
	})

	if (!data) {
		return (
			<div className="min-h-screen bg-background flex flex-col">
				<FocusBar backTo="/luyen-tap/noi" current={0} total={0} />
				<div className="flex-1 flex items-center justify-center">
					<p className="text-muted">Đang tải...</p>
				</div>
			</div>
		)
	}

	if (!sessionId) {
		return (
			<VstepSpeakingPreview
				task={data.data}
				starting={startMutation.isPending}
				onStart={() => startMutation.mutate()}
			/>
		)
	}

	return <VstepSpeakingInProgress task={data.data} sessionId={sessionId} />
}
