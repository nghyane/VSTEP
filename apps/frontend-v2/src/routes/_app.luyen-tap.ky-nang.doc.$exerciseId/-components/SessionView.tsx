import { useSuspenseQuery } from "@tanstack/react-query"
import { SupportModeSwitch } from "#/components/common/SupportModeSwitch"
import { McqNavBar } from "#/components/practice/McqNavBar"
import { McqQuestionList } from "#/components/practice/McqQuestionList"
import { StatusText, SubmitAction } from "#/components/practice/McqSubmitBar"
import { READING_PART_LABELS, type ReadingExercise } from "#/lib/mock/reading"
import type { McqSession } from "#/lib/practice/use-mcq-session"
import { useResetSupportModeOnMount } from "#/lib/practice/use-support-mode"
import { readingExerciseQueryOptions } from "#/lib/queries/reading"
import { PassagePanel } from "./PassagePanel"
import { ReadingSupportPanel } from "./ReadingSupportPanel"
import { useReadingSession } from "./useReadingSession"

export function SessionView({ exerciseId }: { exerciseId: string }) {
	useResetSupportModeOnMount()
	const { data: exercise } = useSuspenseQuery(readingExerciseQueryOptions(exerciseId))
	const session = useReadingSession(exercise)
	const submitted = session.phase === "submitted"

	return (
		<div className="mt-4 space-y-6">
			<SessionHeader exercise={exercise} />

			{session.supportMode && (
				<ReadingSupportPanel
					translation={exercise.vietnameseTranslation}
					keywords={exercise.keywords}
				/>
			)}

			<div className="grid gap-6 lg:grid-cols-2">
				<PassagePanel exercise={exercise} />
				<div className="space-y-4">
					<McqQuestionList
						items={exercise.items}
						selectedAnswers={session.selectedAnswers}
						submitted={submitted}
						showExplanation={session.supportMode}
						onSelect={session.select}
					/>
				</div>
			</div>
			<div aria-hidden className="h-24" />

			<FooterBars session={session} submitted={submitted} />
		</div>
	)
}

function SessionHeader({ exercise }: { exercise: ReadingExercise }) {
	return (
		<header>
			<div className="flex items-start justify-between gap-3">
				<p className="text-xs font-semibold uppercase tracking-wide text-skill-reading">
					{READING_PART_LABELS[exercise.part]}
				</p>
				<SupportModeSwitch />
			</div>
			<div className="mt-1 flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold">{exercise.title}</h1>
					<p className="mt-1 text-sm text-muted-foreground">{exercise.description}</p>
				</div>
				<p className="shrink-0 text-sm text-muted-foreground">
					{exercise.items.length} câu · {exercise.estimatedMinutes} phút
				</p>
			</div>
		</header>
	)
}

function FooterBars({ session, submitted }: { session: McqSession; submitted: boolean }) {
	return (
		<div
			data-session-footer
			className="fixed right-0 bottom-0 left-[var(--dock-left)] z-20 border-t bg-background px-6 py-3"
		>
			<div className="flex items-center gap-4">
				<div className="shrink-0">
					<StatusText
						phase={session.phase}
						answeredCount={session.answeredCount}
						total={session.total}
						score={session.score}
					/>
				</div>
				<div className="min-w-0 flex-1 overflow-x-auto">
					<div className="flex justify-center">
						<McqNavBar
							total={session.total}
							selectedAnswers={session.selectedAnswers}
							submitted={submitted}
							isCorrect={session.isCorrect}
						/>
					</div>
				</div>
				<div className="shrink-0">
					<SubmitAction
						phase={session.phase}
						canSubmit={session.canSubmit}
						backTo="/luyen-tap/ky-nang/doc"
						backLabel="Về danh sách đề đọc"
						onSubmit={session.submit}
						onReset={session.reset}
					/>
				</div>
			</div>
		</div>
	)
}
