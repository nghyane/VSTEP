import { useSuspenseQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { BookOpen, PenLine } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { SampleWithStickers } from "#/components/practice/writing/SampleWithStickers"
import { SmartWritingEditor } from "#/components/practice/writing/SmartWritingEditor"
import { Button } from "#/components/ui/button"
import { WRITING_PART_LABELS } from "#/lib/mock/writing"
import { saveWritingResult } from "#/lib/practice/result-storage"
import { writingExerciseQueryOptions } from "#/lib/queries/writing"
import { cn } from "#/lib/utils"
import { useWritingSession } from "./useWritingSession"

type FocusTab = "write" | "study"

export function SessionView({ exerciseId }: { exerciseId: string }) {
	const navigate = useNavigate()
	const { data: exercise } = useSuspenseQuery(writingExerciseQueryOptions(exerciseId))
	const session = useWritingSession(exercise)
	const [focusTab, setFocusTab] = useState<FocusTab>("write")

	function handleSubmit() {
		const feedback = session.submitAndGetFeedback()
		if (!feedback) {
			toast.error("Vui lòng viết ít nhất một từ trước khi nộp bài")
			return
		}
		if (feedback.wordCount < exercise.minWords) {
			toast.warning(`Bài viết đang thiếu ${exercise.minWords - feedback.wordCount} từ so với yêu cầu (${exercise.minWords}-${exercise.maxWords} từ)`)
		} else if (feedback.wordCount > exercise.maxWords) {
			toast.warning(`Bài viết vượt ${feedback.wordCount - exercise.maxWords} từ so với yêu cầu (${exercise.minWords}-${exercise.maxWords} từ)`)
		} else {
			toast.success("Đã nộp bài thành công")
		}
		saveWritingResult({
			exerciseId,
			userText: session.text,
			wordCount: feedback.wordCount,
			keywordsHit: feedback.keywordsHit,
			keywordCoveragePct: feedback.keywordCoveragePct,
			wordCountInRange: feedback.wordCountInRange,
			hasMultipleParagraphs: feedback.hasMultipleParagraphs,
			stars: feedback.stars,
			submittedAt: Date.now(),
		})
		void navigate({ to: "/luyen-tap/ky-nang/viet/$exerciseId/ket-qua", params: { exerciseId } })
	}

	return (
		<div className="mt-4 space-y-6">
			<Header title={exercise.title} part={exercise.part} description={exercise.description} />

			{/* Prompt card */}
			<div className="mx-auto w-full max-w-3xl rounded-2xl bg-muted/50 p-5 shadow-sm">
				<h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Đề bài</h2>
				<p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{exercise.prompt}</p>
			</div>

			{/* Zen Focus Toggle — dưới đề bài */}
			<div className="flex justify-center">
				<div className="inline-flex items-center gap-1 rounded-full bg-muted p-1">
					<button
						type="button"
						onClick={() => setFocusTab("write")}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
							focusTab === "write" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
						)}
					>
						<PenLine className="size-4" />
						Viết bài
					</button>
					<button
						type="button"
						onClick={() => setFocusTab("study")}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
							focusTab === "study" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
						)}
					>
						<BookOpen className="size-4" />
						Bài mẫu
					</button>
				</div>
			</div>

			{/* Content */}
			{focusTab === "write" ? (
				<div className="mx-auto w-full max-w-3xl">
					<SmartWritingEditor
						value={session.text}
						onChange={session.setText}
						minWords={exercise.minWords}
						maxWords={exercise.maxWords}
						wordCount={session.wordCount}
						enableAutocomplete
					/>
				</div>
			) : (
				<SampleWithStickers
					sampleAnswer={exercise.sampleAnswer}
					sampleMarkers={exercise.sampleMarkers}
				/>
			)}

			<div aria-hidden className="h-24" />
			<footer
				data-session-footer
				className="fixed right-0 bottom-0 left-[var(--dock-left)] z-20 flex items-center justify-between border-t bg-background px-6 py-4"
			>
				<span className="text-sm tabular-nums text-muted-foreground">
					{session.wordCount} / {exercise.minWords}-{exercise.maxWords} từ
				</span>
				<Button type="button" size="lg" className="rounded-full px-8" onClick={handleSubmit} disabled={!session.canSubmit}>
					Nộp bài
				</Button>
			</footer>
		</div>
	)
}

function Header({ title, part, description }: { title: string; part: 1 | 2; description: string }) {
	return (
		<header>
			<p className="text-xs font-semibold uppercase tracking-wide text-skill-writing">{WRITING_PART_LABELS[part]}</p>
			<div className="mt-1">
				<h1 className="text-2xl font-bold">{title}</h1>
				<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			</div>
		</header>
	)
}
