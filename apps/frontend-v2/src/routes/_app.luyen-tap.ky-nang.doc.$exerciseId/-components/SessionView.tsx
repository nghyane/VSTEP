import { useSuspenseQuery } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { McqNavBar } from "#/features/practice/components/McqNavBar"
import { McqQuestionList } from "#/features/practice/components/McqQuestionList"
import { McqResultSummary } from "#/features/practice/components/McqResultSummary"
import { StatusText, SubmitAction } from "#/features/practice/components/McqSubmitBar"
import { readingExerciseQueryOptions } from "#/features/practice/lib/queries-reading"
import type { McqSession } from "#/features/practice/lib/use-mcq-session"
import { READING_PART_LABELS } from "#/mocks/reading"
import { PassagePanel } from "./PassagePanel"
import { useReadingSession } from "./useReadingSession"

export function SessionView({ exerciseId }: { exerciseId: string }) {
	const { data: exercise } = useSuspenseQuery(readingExerciseQueryOptions(exerciseId))
	const session = useReadingSession(exercise)
	const submitted = session.phase === "submitted"
	const topRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (submitted) topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
	}, [submitted])

	return (
		<div ref={topRef} className="mt-4 space-y-6">
			<header>
				<p className="text-xs font-semibold uppercase tracking-wide text-skill-reading">
					{READING_PART_LABELS[exercise.part]}
				</p>
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

			{submitted && <McqResultSummary score={session.score} total={session.total} />}

			<div className="grid gap-6 lg:grid-cols-2">
				<PassagePanel exercise={exercise} />
				<div className="space-y-4">
					<McqQuestionList
						items={exercise.items}
						selectedAnswers={session.selectedAnswers}
						submitted={submitted}
						onSelect={session.select}
					/>
				</div>
			</div>
			<div aria-hidden className="h-24" />

			<FooterBar session={session} submitted={submitted} />
		</div>
	)
}

function FooterBar({ session, submitted }: { session: McqSession; submitted: boolean }) {
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
						backTo="/luyen-tap/ky-nang"
						backSearch={{ skill: "doc", category: "", page: 1 }}
						backLabel="Về danh sách đề đọc"
						onSubmit={session.submit}
						onReset={session.reset}
					/>
				</div>
			</div>
		</div>
	)
}
