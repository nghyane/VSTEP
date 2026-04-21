import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
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
	const { topicId } = Route.useParams()
	const { data } = useQuery(vocabTopicDetailQuery(topicId))
	const s = useFlashcardSession(data?.data?.words ?? [])

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<FocusBar backTo="/luyen-tap/tu-vung/$topicId" backParams={{ topicId }} current={s.index} total={s.total} />
			<div className="flex-1 flex items-center justify-center px-6 pb-8">
				{!data ? (
					<p className="text-muted">Đang tải...</p>
				) : s.total === 0 ? (
					<FocusEmpty backTo="/luyen-tap/tu-vung/$topicId" backParams={{ topicId }} title="Chưa có từ vựng" message="Chủ đề này chưa có từ nào." />
				) : s.done ? (
					<FocusComplete backTo="/luyen-tap/tu-vung/$topicId" backParams={{ topicId }} total={s.reviewed} message={`Bạn đã ôn xong ${s.reviewed} lượt.`} />
				) : (
					<div className="w-full max-w-lg space-y-4">
						<FlashcardCard word={s.current!.word} revealed={s.revealed} onReveal={s.reveal} />
						{s.revealed && <SrsRatingButtons disabled={s.submitting} onRate={s.rate} />}
						<p className="text-xs text-subtle text-center">Space: xem nghĩa · 1-4: đánh giá</p>
					</div>
				)}
			</div>
		</div>
	)
}
