import { useMutation } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { HTTPError } from "ky"
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

	if (startMutation.isError) {
		const err = startMutation.error
		const isHttp = err instanceof HTTPError
		const status = isHttp ? err.response.status : 0

		// 422: active session đã tồn tại — gợi ý FE tiếp tục session cũ hoặc end trước.
		const isActiveConflict = status === 422
		// 503: AI service down — retry button
		const isServiceDown = status === 503

		const message = isActiveConflict
			? "Bạn đang có 1 cuộc hội thoại đang diễn ra với scenario này. Hãy kết thúc trước khi bắt đầu mới."
			: isServiceDown
				? "AI tạm thời không phản hồi. Vui lòng thử lại sau."
				: "Không thể bắt đầu cuộc hội thoại. Vui lòng thử lại."

		return (
			<div className="min-h-screen bg-background flex items-center justify-center px-6">
				<div className="card max-w-md w-full p-6 text-center space-y-4">
					<p className="text-sm font-bold text-destructive">{message}</p>
					<div className="flex gap-2 justify-center">
						{!isActiveConflict && (
							<button
								type="button"
								onClick={() => {
									started.current = false
									startMutation.reset()
									started.current = true
									startMutation.mutate()
								}}
								className="btn btn-primary px-6"
							>
								Thử lại
							</button>
						)}
						<button
							type="button"
							onClick={() => navigate({ to: "/luyen-tap/noi" })}
							className="btn btn-secondary px-6"
						>
							Quay lại
						</button>
					</div>
				</div>
			</div>
		)
	}

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
