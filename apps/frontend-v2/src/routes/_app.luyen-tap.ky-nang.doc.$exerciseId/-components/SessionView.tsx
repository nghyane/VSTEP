import { useSuspenseQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useEffect, useRef } from "react"
import { CelebrationCard } from "#/features/practice/components/CelebrationCard"
import { McqQuestionList } from "#/features/practice/components/McqQuestionList"
import { SubmitAction } from "#/features/practice/components/McqSubmitBar"
import { SessionProgressBar } from "#/features/practice/components/SessionProgressBar"
import { SkillStepChips } from "#/features/practice/components/SkillStepChips"
import { readingExerciseQueryOptions } from "#/features/practice/lib/queries-reading"
import type { McqSession } from "#/features/practice/lib/use-mcq-session"
import { READING_PART_LABELS } from "#/mocks/reading"
import { Button } from "#/shared/ui/button"
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
				<p className="text-xs font-bold uppercase tracking-wide text-skill-reading">
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

			{submitted && (
				<CelebrationCard
					score={session.score}
					total={session.total}
					accentClass="border-b-skill-reading/50"
					onReset={session.reset}
					backHref={
						<Button variant="outline" asChild>
							<Link to="/luyen-tap/ky-nang" search={{ skill: "doc", category: "", page: 1 }}>
								Về danh sách
							</Link>
						</Button>
					}
				/>
			)}

			<div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
				<PassagePanel exercise={exercise} />
				<div className="space-y-4">
					<SessionProgressBar
						current={session.answeredCount}
						total={session.total}
						accentClass="bg-skill-reading"
					/>
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
	const answered = Array.from({ length: session.total }, (_, i) => session.selectedAnswers[i] != null)
	const correctArr = submitted ? Array.from({ length: session.total }, (_, i) => session.isCorrect(i)) : undefined

	return (
		<div
			data-session-footer
			className="fixed right-0 bottom-0 left-[var(--dock-left)] z-20 border-t border-t-skill-reading/30 bg-background px-6 py-3"
		>
			<div className="flex items-center gap-4">
				<div className="shrink-0 text-sm text-muted-foreground">
					<span className="font-bold text-foreground">{session.answeredCount}</span>/{session.total} câu
				</div>
				<div className="min-w-0 flex-1 overflow-x-auto">
					<div className="flex justify-center">
						<SkillStepChips
							total={session.total}
							answered={answered}
							submitted={submitted}
							isCorrect={correctArr}
							accentClass="bg-skill-reading"
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
