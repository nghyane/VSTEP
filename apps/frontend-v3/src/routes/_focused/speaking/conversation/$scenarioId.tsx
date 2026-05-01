import { useMutation } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { startConversation } from "#/features/practice/actions"
import { ConversationInProgress } from "#/features/practice/components/ConversationInProgress"
import type { ConversationSessionDetail } from "#/features/practice/types"
import { warmupTTS } from "#/lib/utils"

export const Route = createFileRoute("/_focused/speaking/conversation/$scenarioId")({
	component: ConversationPage,
})

function ConversationPage() {
	const { scenarioId } = Route.useParams()
	const navigate = useNavigate()
	const [session, setSession] = useState<ConversationSessionDetail | null>(null)
	const started = useRef(false)

	const startMutation = useMutation({
		mutationFn: () => startConversation(scenarioId),
		onSuccess: (res) => setSession(res.data),
	})

	useEffect(() => {
		if (started.current) return
		started.current = true
		warmupTTS()
		startMutation.mutate()
	}, [startMutation.mutate])

	if (!session) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="flex gap-1.5">
					<div className="w-2.5 h-2.5 rounded-full bg-skill-speaking animate-[dotBounce_1.2s_ease-in-out_infinite]" />
					<div
						className="w-2.5 h-2.5 rounded-full bg-skill-speaking animate-[dotBounce_1.2s_ease-in-out_infinite]"
						style={{ animationDelay: "0.2s" }}
					/>
					<div
						className="w-2.5 h-2.5 rounded-full bg-skill-speaking animate-[dotBounce_1.2s_ease-in-out_infinite]"
						style={{ animationDelay: "0.4s" }}
					/>
				</div>
			</div>
		)
	}

	return <ConversationInProgress session={session} onEnd={() => navigate({ to: "/luyen-tap/noi" })} />
}
