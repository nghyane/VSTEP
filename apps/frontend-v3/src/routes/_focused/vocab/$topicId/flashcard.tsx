import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useEffect } from "react"
import { FlashcardCard } from "#/features/vocab/components/FlashcardCard"
import { FocusBar } from "#/features/vocab/components/FocusBar"
import { FocusComplete, FocusEmpty } from "#/features/vocab/components/FocusStates"
import { SrsRatingButtons } from "#/features/vocab/components/SrsRatingButtons"
import { vocabTopicDetailQuery } from "#/features/vocab/queries"
import { useFlashcardSession } from "#/features/vocab/use-flashcard-session"

export const Route = createFileRoute("/_focused/vocab/$topicId/flashcard")({
	component: FlashcardPage,
})

function FlashcardPage() {
	const qc = useQueryClient()
	const { topicId } = Route.useParams()
	const { data } = useQuery(vocabTopicDetailQuery(topicId))
	const words = data ? data.data.words : []
	const s = useFlashcardSession(words)
	const back = { backTo: "/luyen-tap/tu-vung/$topicId", backParams: { topicId } }

	const invalidate = useCallback(() => {
		qc.invalidateQueries({ queryKey: ["vocab", "topics", topicId] })
		qc.invalidateQueries({ queryKey: ["vocab", "topics"], exact: true })
	}, [qc, topicId])

	useEffect(() => invalidate, [invalidate])

	if (!data) return <Loading {...back} />

	if (s.status === "empty") {
		return <FocusEmpty {...back} title="Chưa có từ vựng" message="Chủ đề này chưa có từ nào." />
	}

	if (s.status === "done") {
		return <FocusComplete {...back} total={s.reviewed} message={`Bạn đã ôn xong ${s.reviewed} lượt.`} />
	}

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<FocusBar {...back} current={s.index} total={s.total} />
			<div className="flex-1 flex items-center justify-center px-6 pb-8">
				<div className="w-full max-w-lg space-y-4">
					{s.current && (
						<>
							<FlashcardCard word={s.current.word} revealed={s.revealed} onReveal={s.reveal} />
							{s.revealed && <SrsRatingButtons disabled={s.submitting} onRate={s.rate} />}
						</>
					)}
					<p className="text-xs text-subtle text-center">Space: xem nghĩa · 1-4: đánh giá</p>
				</div>
			</div>
		</div>
	)
}

function Loading({ backTo, backParams }: { backTo: string; backParams?: Record<string, string> }) {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<FocusBar backTo={backTo} backParams={backParams} current={0} total={0} />
			<div className="flex-1 flex items-center justify-center">
				<p className="text-muted">Đang tải...</p>
			</div>
		</div>
	)
}
