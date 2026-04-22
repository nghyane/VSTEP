import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { startSpeakingDrillSession } from "#/features/practice/actions"
import { SpeakingDrillInProgress } from "#/features/practice/components/SpeakingDrillInProgress"
import { SpeakingDrillPreview } from "#/features/practice/components/SpeakingDrillPreview"
import { speakingDrillDetailQuery } from "#/features/practice/queries"
import { FocusBar } from "#/features/vocab/components/FocusBar"

export const Route = createFileRoute("/_focused/speaking/drill/$drillId")({
	component: SpeakingDrillPage,
})

function SpeakingDrillPage() {
	const { drillId } = Route.useParams()
	const { data } = useQuery(speakingDrillDetailQuery(drillId))
	const [sessionId, setSessionId] = useState<string | null>(null)

	const startMutation = useMutation({
		mutationFn: () => startSpeakingDrillSession(drillId),
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
			<SpeakingDrillPreview
				drill={data.data}
				starting={startMutation.isPending}
				onStart={() => startMutation.mutate()}
			/>
		)
	}

	return <SpeakingDrillInProgress drill={data.data} sessionId={sessionId} />
}
