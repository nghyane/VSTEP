import { useEffect } from "react"
import { FlipCard } from "#/features/vocab/components/FlipCard"
import { FocusBar } from "#/features/vocab/components/FocusBar"
import { FocusComplete, FocusEmpty } from "#/features/vocab/components/FocusStates"
import { PracticeBack, PracticeFront } from "#/features/vocab/components/PracticeFaces"
import { SrsRatingButtons } from "#/features/vocab/components/SrsRatingButtons"
import { StaticPracticeView } from "#/features/vocab/components/StaticPracticeView"
import type { BackLink, PracticeMode, SrsRating, WordWithState } from "#/features/vocab/types"
import {
	buildPracticeItems,
	type PracticeSession,
	usePracticeSession,
} from "#/features/vocab/use-practice-session"

const KEY_TO_RATING: Record<string, SrsRating> = { "1": 1, "2": 2, "3": 3, "4": 4 }

interface Props {
	words: WordWithState[]
	mode: PracticeMode
	back: BackLink
}

export function PracticeFlow({ words, mode, back }: Props) {
	const items = buildPracticeItems(words, mode)
	const s = usePracticeSession(items)

	usePracticeKeyboard(s)

	if (s.status === "empty") {
		return (
			<FocusEmpty {...back} title="Chưa có từ vựng" message="Chủ đề này chưa có từ phù hợp với chế độ này." />
		)
	}
	if (s.status === "done") {
		return <FocusComplete {...back} total={s.reviewed} message={`Bạn đã ôn xong ${s.reviewed} lượt.`} />
	}
	if (!s.current) return null

	const flipped = s.phase === "reveal"
	const isFlipMode = s.current.mode === "flashcard"

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<FocusBar {...back} current={s.index} total={s.total} />
			<div className="flex-1 flex items-center justify-center px-6 pb-8">
				<div className="w-full max-w-xl space-y-5">
					{isFlipMode ? (
						<FlipCard
							item={s.current}
							flip={{ flipped, highlight: null, onFlip: s.reveal }}
							faces={{
								front: <PracticeFront item={s.current} />,
								back: <PracticeBack item={s.current} />,
							}}
						/>
					) : (
						<StaticPracticeView item={s.current} session={s} />
					)}

					{flipped ? (
						<SrsRatingButtons disabled={s.submitting} onRate={s.rate} />
					) : isFlipMode ? (
						<p className="text-xs text-subtle text-center">Space: lật thẻ · 1-4: đánh giá</p>
					) : null}
				</div>
			</div>
		</div>
	)
}

function usePracticeKeyboard(s: PracticeSession) {
	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (!s.current) return
			const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
			// Space → flip flashcard (only flashcard mode, not when typing in input)
			if (e.key === " " && s.current.mode === "flashcard" && s.phase === "prompt" && !isInput) {
				e.preventDefault()
				s.reveal()
				return
			}
			// 1-4 → rate (after reveal, not when typing)
			if (s.phase === "reveal" && !isInput) {
				const rating = KEY_TO_RATING[e.key]
				if (rating && !s.submitting) s.rate(rating)
			}
		}
		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	}, [s.current, s.phase, s.submitting, s.reveal, s.rate])
}
