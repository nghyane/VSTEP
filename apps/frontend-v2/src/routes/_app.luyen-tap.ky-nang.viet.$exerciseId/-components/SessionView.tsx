import { useSuspenseQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { WritingSupportLevelPicker } from "#/components/common/WritingSupportLevelPicker"
import { Button } from "#/components/ui/button"
import { WRITING_PART_LABELS, type WritingExercise } from "#/lib/mock/writing"
import { saveWritingResult } from "#/lib/practice/result-storage"
import { useWritingSupportLevel } from "#/lib/practice/use-writing-support-level"
import { writingExerciseQueryOptions } from "#/lib/queries/writing"
import { useWritingSession } from "./useWritingSession"
import { WritingEditor } from "./WritingEditor"
import { WritingOutlinePanel } from "./WritingOutlinePanel"
import { WritingSupportPanel } from "./WritingSupportPanel"
import { WritingTemplateEditor } from "./WritingTemplateEditor"
import { WritingTemplatePanel } from "./WritingTemplatePanel"

export function SessionView({ exerciseId }: { exerciseId: string }) {
	const navigate = useNavigate()
	const { data: exercise } = useSuspenseQuery(writingExerciseQueryOptions(exerciseId))
	const session = useWritingSession(exercise)
	const supportLevel = useWritingSupportLevel()

	function handleSubmit() {
		const feedback = session.submitAndGetFeedback()
		if (!feedback) {
			toast.error("Vui lòng viết ít nhất một từ trước khi nộp bài")
			return
		}
		if (feedback.wordCount < exercise.minWords) {
			toast.warning(
				`Bài viết đang thiếu ${exercise.minWords - feedback.wordCount} từ so với yêu cầu (${exercise.minWords}-${exercise.maxWords} từ)`,
			)
		} else if (feedback.wordCount > exercise.maxWords) {
			toast.warning(
				`Bài viết vượt ${feedback.wordCount - exercise.maxWords} từ so với yêu cầu (${exercise.minWords}-${exercise.maxWords} từ)`,
			)
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
			<PromptCard prompt={exercise.prompt} />
			<WritingPhaseBody
				exercise={exercise}
				supportLevel={supportLevel}
				text={session.text}
				wordCount={session.wordCount}
				canSubmit={session.canSubmit}
				onChange={session.setText}
				onSubmit={handleSubmit}
			/>
		</div>
	)
}

// ─── Header ────────────────────────────────────────────────────────

function Header({ title, part, description }: { title: string; part: 1 | 2; description: string }) {
	return (
		<header>
			<p className="text-xs font-semibold uppercase tracking-wide text-skill-writing">
				{WRITING_PART_LABELS[part]}
			</p>
			<div className="mt-1">
				<h1 className="text-2xl font-bold">{title}</h1>
				<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			</div>
		</header>
	)
}

function PromptCard({ prompt }: { prompt: string }) {
	return (
		<div className="rounded-2xl border bg-muted/30 p-5">
			<h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Đề bài
			</h2>
			<p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{prompt}</p>
		</div>
	)
}

// ─── Writing phase ─────────────────────────────────────────────────

interface WritingBodyProps {
	exercise: WritingExercise
	supportLevel: ReturnType<typeof useWritingSupportLevel>
	text: string
	wordCount: number
	canSubmit: boolean
	onChange: (text: string) => void
	onSubmit: () => void
}

function WritingPhaseBody(props: WritingBodyProps) {
	const { exercise, supportLevel, text, wordCount, canSubmit, onChange, onSubmit } = props

	const sidePanel =
		supportLevel === "hints" ? (
			<WritingSupportPanel keywords={exercise.keywords} starters={exercise.sentenceStarters} />
		) : supportLevel === "outline" ? (
			<WritingOutlinePanel
				outline={exercise.outline}
				sampleAnswer={exercise.sampleAnswer}
				keywords={exercise.keywords}
			/>
		) : null

	const isTemplate = supportLevel === "template"

	return (
		<>
			<div className="space-y-4">
				{sidePanel && <div className="rounded-2xl border bg-muted/30 p-4">{sidePanel}</div>}
				<div className="min-w-0">
					{isTemplate ? (
						<div className="overflow-hidden rounded-2xl border border-border bg-card">
							<div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
								<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Bài viết
								</span>
								<WritingSupportLevelPicker level={supportLevel} />
							</div>
							<div className="p-4">
								{exercise.template ? (
									<WritingTemplateEditor template={exercise.template} onChange={onChange} />
								) : (
									<WritingTemplatePanel />
								)}
							</div>
						</div>
					) : (
						<WritingEditor
							value={text}
							onChange={onChange}
							minWords={exercise.minWords}
							maxWords={exercise.maxWords}
							wordCount={wordCount}
							supportLevel={supportLevel}
						/>
					)}
				</div>
				{/* panel moved above editor */}
			</div>
			<div aria-hidden className="h-24" />
			<footer
				data-session-footer
				className="fixed right-0 bottom-0 left-[var(--dock-left)] z-20 flex items-center justify-end border-t bg-background px-6 py-4"
			>
				<Button
					type="button"
					size="lg"
					className="rounded-xl px-8"
					onClick={onSubmit}
					disabled={!canSubmit}
				>
					Nộp bài
				</Button>
			</footer>
		</>
	)
}
