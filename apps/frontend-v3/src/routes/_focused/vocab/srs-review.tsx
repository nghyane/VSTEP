import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { reviewWord, type SrsRating } from "#/features/vocab/actions"
import { FlashcardCard } from "#/features/vocab/components/FlashcardCard"
import { FocusBar } from "#/features/vocab/components/FocusBar"
import { FocusComplete, FocusEmpty } from "#/features/vocab/components/FocusStates"
import { SrsRatingButtons } from "#/features/vocab/components/SrsRatingButtons"
import { vocabSrsQueueQuery } from "#/features/vocab/queries"

export const Route = createFileRoute("/_focused/vocab/srs-review")({
	component: SrsReviewPage,
})

function SrsReviewPage() {
	const { data } = useQuery(vocabSrsQueueQuery)
	const items = data?.data?.items ?? []
	const [index, setIndex] = useState(0)
	const [flipped, setFlipped] = useState(false)
	const [submitting, setSubmitting] = useState(false)

	const current = items[index]
	const total = items.length
	const back = { backTo: "/luyen-tap/tu-vung" as const }

	async function handleRate(rating: SrsRating) {
		if (!current || submitting) return
		setSubmitting(true)
		await reviewWord(current.word.id, rating)
		setSubmitting(false)
		setFlipped(false)
		setIndex((i) => i + 1)
	}

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<FocusBar {...back} current={index} total={total} />
			<div className="flex-1 flex items-center justify-center px-6 pb-8">
				{!data ? (
					<p className="text-muted">Đang tải...</p>
				) : total === 0 ? (
					<FocusEmpty {...back} title="Hôm nay đã ôn xong!" message="Quay lại vào ngày mai." mascot="/mascot/lac-happy.png" />
				) : index >= total ? (
					<FocusComplete {...back} total={total} message={`Bạn đã ôn xong ${total} từ hôm nay.`} />
				) : (
					<div className="w-full max-w-lg">
						<FlashcardCard word={current.word} flipped={flipped} onFlip={() => setFlipped(true)} />
						{flipped && <SrsRatingButtons disabled={submitting} onRate={handleRate} />}
					</div>
				)}
			</div>
		</div>
	)
}
