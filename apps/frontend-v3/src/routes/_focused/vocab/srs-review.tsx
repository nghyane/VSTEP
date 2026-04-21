import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { FlashcardCard } from "#/features/vocab/components/FlashcardCard"
import { FocusBar } from "#/features/vocab/components/FocusBar"
import { FocusComplete, FocusEmpty } from "#/features/vocab/components/FocusStates"
import { SrsRatingButtons } from "#/features/vocab/components/SrsRatingButtons"
import { vocabSrsQueueQuery } from "#/features/vocab/queries"
import { useFlashcardSession } from "#/features/vocab/use-flashcard-session"

export const Route = createFileRoute("/_focused/vocab/srs-review")({
	component: SrsReviewPage,
})

function SrsReviewPage() {
	const { data } = useQuery(vocabSrsQueueQuery)
	const s = useFlashcardSession(data?.data?.items ?? [])

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<FocusBar backTo="/luyen-tap/tu-vung" current={s.index} total={s.total} />
			<div className="flex-1 flex items-center justify-center px-6 pb-8">
				{!data ? (
					<p className="text-muted">Đang tải...</p>
				) : s.total === 0 ? (
					<FocusEmpty backTo="/luyen-tap/tu-vung" title="Hôm nay đã ôn xong!" message="Quay lại vào ngày mai." />
				) : s.done ? (
					<FocusComplete backTo="/luyen-tap/tu-vung" total={s.reviewed} message={`Bạn đã ôn xong ${s.reviewed} lượt hôm nay.`} />
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
