import { useSuspenseQuery } from "@tanstack/react-query"
import { SupportModeSwitch } from "#/components/common/SupportModeSwitch"
import { Button } from "#/components/ui/button"
import { WRITING_PART_LABELS, type WritingExercise } from "#/lib/mock/writing"
import { useSupportMode } from "#/lib/practice/use-support-mode"
import { writingExerciseQueryOptions } from "#/lib/queries/writing"
import { SubmittedView } from "./SubmittedView"
import { useWritingSession } from "./useWritingSession"
import { WritingEditor } from "./WritingEditor"
import { WritingSupportPanel } from "./WritingSupportPanel"

export function SessionView({ exerciseId }: { exerciseId: string }) {
	const { data: exercise } = useSuspenseQuery(writingExerciseQueryOptions(exerciseId))
	const session = useWritingSession(exercise)
	const supportMode = useSupportMode()

	return (
		<div className="mt-4 space-y-6">
			<Header title={exercise.title} part={exercise.part} description={exercise.description} />
			<PromptCard prompt={exercise.prompt} />

			{session.phase === "writing" ? (
				<WritingPhaseBody
					exercise={exercise}
					supportMode={supportMode}
					text={session.text}
					wordCount={session.wordCount}
					canSubmit={session.canSubmit}
					onChange={session.setText}
					onInsertStarter={session.insertTemplate}
					onSubmit={session.submit}
				/>
			) : session.feedback ? (
				<SubmittedView
					exercise={exercise}
					userText={session.text}
					feedback={session.feedback}
					onReset={session.reset}
				/>
			) : null}
		</div>
	)
}

// ─── Header ────────────────────────────────────────────────────────

function Header({ title, part, description }: { title: string; part: 1 | 2; description: string }) {
	return (
		<header>
			<div className="flex items-start justify-between gap-3">
				<p className="text-xs font-semibold uppercase tracking-wide text-skill-writing">
					{WRITING_PART_LABELS[part]}
				</p>
				<SupportModeSwitch />
			</div>
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
	supportMode: boolean
	text: string
	wordCount: number
	canSubmit: boolean
	onChange: (text: string) => void
	onInsertStarter: (template: string) => void
	onSubmit: () => void
}

function WritingPhaseBody(props: WritingBodyProps) {
	const { exercise, supportMode, text, wordCount, canSubmit, onChange, onInsertStarter, onSubmit } =
		props
	return (
		<>
			{supportMode && (
				<WritingSupportPanel
					keywords={exercise.keywords}
					starters={exercise.sentenceStarters}
					onInsertStarter={onInsertStarter}
				/>
			)}
			<WritingEditor
				value={text}
				onChange={onChange}
				minWords={exercise.minWords}
				maxWords={exercise.maxWords}
				wordCount={wordCount}
			/>
			<div aria-hidden className="h-24" />
			<footer className="fixed right-0 bottom-0 left-[var(--dock-left)] z-20 flex items-center justify-end border-t bg-background px-6 py-4">
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
