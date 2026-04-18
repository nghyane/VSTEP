import { useSuspenseQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { BookOpen, PenLine } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { SampleWithStickers } from "#/features/practice/components/writing/SampleWithStickers"
import { SmartWritingEditor } from "#/features/practice/components/writing/SmartWritingEditor"
import { WordCountMilestones } from "#/features/practice/components/writing/WordCountMilestones"
import { writingExerciseQueryOptions } from "#/features/practice/lib/queries-writing"
import { saveWritingResult } from "#/features/practice/lib/result-storage"
import { WRITING_PART_LABELS } from "#/mocks/writing"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"
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

			{/* Prompt card — depth border */}
			<div className="mx-auto w-full max-w-3xl rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-5">
				<h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Đề bài</h2>
				<p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{exercise.prompt}</p>
			</div>

			{/* Tab toggle */}
			<div className="flex justify-center">
				<div className="inline-flex items-center gap-1 rounded-lg border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-1">
					<button
						type="button"
						onClick={() => setFocusTab("write")}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-all",
							focusTab === "write" ? "bg-skill-writing text-white" : "text-muted-foreground hover:text-foreground",
						)}
					>
						<PenLine className="size-4" />
						Viết bài
					</button>
					<button
						type="button"
						onClick={() => setFocusTab("study")}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-all",
							focusTab === "study" ? "bg-skill-writing text-white" : "text-muted-foreground hover:text-foreground",
						)}
					>
						<BookOpen className="size-4" />
						Bài mẫu
					</button>
				</div>
			</div>

			{/* Content */}
			{focusTab === "write" ? (
				<div className="mx-auto w-full max-w-3xl space-y-4">
					<WordCountMilestones wordCount={session.wordCount} minWords={exercise.minWords} maxWords={exercise.maxWords} />
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
				<SampleWithStickers sampleAnswer={exercise.sampleAnswer} sampleMarkers={exercise.sampleMarkers} />
			)}

			<div aria-hidden className="h-24" />
			<footer
				data-session-footer
				className="fixed right-0 bottom-0 left-[var(--dock-left)] z-20 flex items-center justify-between border-t border-t-skill-writing/30 bg-background px-6 py-4"
			>
				<span className={cn(
					"text-sm font-bold tabular-nums",
					session.wordCount >= exercise.minWords && session.wordCount <= exercise.maxWords ? "text-success" :
					session.wordCount > exercise.maxWords ? "text-destructive" : "text-muted-foreground",
				)}>
					{session.wordCount} / {exercise.minWords}–{exercise.maxWords} từ
				</span>
				<Button type="button" onClick={handleSubmit} disabled={!session.canSubmit}>
					Nộp bài
				</Button>
			</footer>
		</div>
	)
}

function Header({ title, part, description }: { title: string; part: 1 | 2; description: string }) {
	return (
		<header>
			<p className="text-xs font-bold uppercase tracking-wide text-skill-writing">{WRITING_PART_LABELS[part]}</p>
			<div className="mt-1">
				<h1 className="text-2xl font-bold">{title}</h1>
				<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			</div>
		</header>
	)
}
