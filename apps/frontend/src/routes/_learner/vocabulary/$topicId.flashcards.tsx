import { ArrowLeft01Icon, ArrowRight01Icon, Refresh01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { VocabWord } from "./-components/mock-data"
import { getMockTopic } from "./-components/mock-data"
import { markLearned } from "./-components/use-vocab-progress"

export const Route = createFileRoute("/_learner/vocabulary/$topicId/flashcards")({
	component: FlashcardsPage,
})

interface FlashcardProps {
	word: VocabWord
	flipped: boolean
	onFlip: () => void
}

function Flashcard({ word, flipped, onFlip }: FlashcardProps) {
	return (
		<div className="flex justify-center">
			<button
				type="button"
				onClick={onFlip}
				className="relative h-96 w-full max-w-2xl cursor-pointer [perspective:1200px]"
			>
				<div
					className={cn(
						"relative size-full transition-transform duration-500 [transform-style:preserve-3d]",
						flipped && "[transform:rotateY(180deg)]",
					)}
				>
					{/* Front */}
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-card p-10 shadow-sm [backface-visibility:hidden]">
						<p className="text-4xl font-bold">{word.word}</p>
						<p className="text-xl text-muted-foreground">{word.phonetic}</p>
						<p className="mt-4 text-sm text-muted-foreground">Nhấn để xem nghĩa</p>
					</div>

					{/* Back */}
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-2xl bg-card p-10 shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
						<p className="text-center text-base font-medium leading-relaxed">{word.definition}</p>
						<p className="text-center text-base text-muted-foreground leading-relaxed">
							{word.explanation}
						</p>
						{word.examples[0] && (
							<p className="mt-2 text-center text-sm italic text-muted-foreground">
								&ldquo;{word.examples[0]}&rdquo;
							</p>
						)}
						<p className="mt-2 text-xs text-muted-foreground">Nhấn để lật lại</p>
					</div>
				</div>
			</button>
		</div>
	)
}

function FlashcardsPage() {
	const { topicId } = Route.useParams()
	const topic = getMockTopic(topicId)
	const [current, setCurrent] = useState(0)
	const [flipped, setFlipped] = useState(false)
	const [completed, setCompleted] = useState(false)

	if (!topic) {
		return (
			<div className="flex flex-col items-center gap-4 rounded-2xl bg-muted/50 py-16">
				<p className="text-muted-foreground">Không tìm thấy chủ đề.</p>
				<Button variant="outline" asChild>
					<Link to="/vocabulary">Quay lại</Link>
				</Button>
			</div>
		)
	}

	const words = topic.words
	const word = words[current]
	const isFirst = current === 0
	const isLast = current === words.length - 1

	function goNext() {
		if (!isLast) {
			setFlipped(false)
			setCurrent((p) => p + 1)
		}
	}

	function goPrev() {
		if (!isFirst) {
			setFlipped(false)
			setCurrent((p) => p - 1)
		}
	}

	function handleFlip() {
		setFlipped((f) => {
			if (!f) {
				markLearned(topicId, word.id)
				if (isLast) setCompleted(true)
			}
			return !f
		})
	}

	const flipRef = useRef(handleFlip)
	const goNextRef = useRef(goNext)
	const goPrevRef = useRef(goPrev)
	flipRef.current = handleFlip
	goNextRef.current = goNext
	goPrevRef.current = goPrev

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === " ") {
				e.preventDefault()
				flipRef.current()
			} else if (e.key === "ArrowRight") {
				goNextRef.current()
			} else if (e.key === "ArrowLeft") {
				goPrevRef.current()
			}
		}
		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	}, [])

	function handleReset() {
		setCurrent(0)
		setFlipped(false)
		setCompleted(false)
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<Link
						to="/vocabulary/$topicId"
						params={{ topicId }}
						className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
					>
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						{topic.name}
					</Link>
					<h1 className="text-2xl font-bold">Thẻ ghi nhớ</h1>
				</div>
				<span className="text-sm font-medium text-muted-foreground">
					{current + 1}/{words.length}
				</span>
			</div>

			{/* Progress bar */}
			<div className="h-1.5 overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-primary transition-all"
					style={{ width: `${((current + 1) / words.length) * 100}%` }}
				/>
			</div>

			{/* Flashcard */}
			<Flashcard word={word} flipped={flipped} onFlip={handleFlip} />

			{/* Navigation */}
			<div className="flex items-center justify-center gap-3">
				<Button variant="outline" size="sm" disabled={isFirst} onClick={goPrev}>
					<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
					Trước
				</Button>
				<Button variant="ghost" size="sm" onClick={handleReset}>
					<HugeiconsIcon icon={Refresh01Icon} className="size-4" />
					Bắt đầu lại
				</Button>
				<Button variant="outline" size="sm" disabled={isLast} onClick={goNext}>
					Tiếp
					<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
				</Button>
			</div>

			{/* Completed state */}
			{completed && (
				<div className="rounded-2xl border border-green-200 bg-green-50/50 p-6 text-center dark:border-green-800 dark:bg-green-950/20">
					<p className="text-lg font-bold">Hoàn thành!</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Bạn đã xem hết {words.length} từ trong chủ đề này.
					</p>
					<div className="mt-4 flex justify-center gap-2">
						<Button variant="outline" size="sm" onClick={handleReset}>
							Học lại
						</Button>
						<Button size="sm" asChild>
							<Link to="/vocabulary/$topicId/practice" params={{ topicId }}>
								Luyện điền từ
							</Link>
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}
