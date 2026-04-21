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
	const back = { backTo: "/luyen-tap/tu-vung" }

	if (!data) {
		return (
			<div className="min-h-screen bg-background flex flex-col">
				<FocusBar {...back} current={0} total={0} />
				<div className="flex-1 flex items-center justify-center">
					<p className="text-muted">Đang tải...</p>
				</div>
			</div>
		)
	}

	if (s.status === "empty") {
		return <FocusEmpty {...back} title="Hôm nay đã ôn xong!" message="Quay lại vào ngày mai." />
	}

	if (s.status === "done") {
		return <FocusComplete {...back} total={s.reviewed} message={`Bạn đã ôn xong ${s.reviewed} lượt hôm nay.`} />
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
