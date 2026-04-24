import { Link } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"
import { QuestionList } from "#/features/practice/components/QuestionList"
import { QuestionNav } from "#/features/practice/components/QuestionNav"
import type { ReadingExerciseDetail } from "#/features/practice/types"
import type { McqPracticeSession } from "#/features/practice/use-mcq-session"

interface Props {
	detail: ReadingExerciseDetail
	session: McqPracticeSession
}

export function ReadingInProgress({ detail, session }: Props) {
	const { exercise, questions } = detail

	return (
		<div className="flex flex-col h-screen bg-background">
			{/* Header */}
			<div className="flex items-center gap-3 border-b-2 border-border bg-surface px-4 py-2.5 shrink-0">
				<Link to="/luyen-tap/doc" className="p-1 hover:opacity-70 shrink-0">
					<Icon name="close" size="xs" className="text-muted" />
				</Link>
				<div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
					<div
						className="h-full bg-skill-reading rounded-full transition-all"
						style={{ width: `${(session.answeredCount / questions.length) * 100}%` }}
					/>
				</div>
				<span className="text-xs font-bold text-muted shrink-0">
					{session.answeredCount}/{questions.length}
				</span>
			</div>

			{/* Scrollable content */}
			<div className="flex-1 overflow-y-auto">
				<div className="max-w-5xl mx-auto px-6 py-6">
					{/* Result */}
					{session.result && (
						<div className="card p-6 text-center mb-6">
							<img src="/mascot/lac-happy.png" alt="" className="w-20 h-20 mx-auto mb-3 object-contain" />
							<p className="font-extrabold text-2xl text-foreground">
								{session.result.score}/{session.result.total}
							</p>
							<p className="text-sm text-muted mt-1">câu đúng</p>
							<div className="flex justify-center gap-3 mt-4">
								<Link
									to="/luyen-tap/doc"
									className="py-2 px-5 font-bold text-sm rounded-(--radius-button) text-primary-foreground bg-skill-reading shadow-[0_3px_0_var(--color-skill-reading-dark)] active:shadow-[0_1px_0_var(--color-skill-reading-dark)] active:translate-y-[2px] transition uppercase"
								>
									Về danh sách
								</Link>
							</div>
						</div>
					)}

					{/* Two-column: passage + questions */}
					<div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
						{/* Passage */}
						<div className="card p-6 self-start lg:sticky lg:top-6">
							<p className="text-xs font-bold text-skill-reading uppercase tracking-wide mb-2">
								Part {exercise.part}
							</p>
							<h2 className="font-bold text-lg text-foreground mb-4">{exercise.title}</h2>
							<div className="text-sm leading-relaxed text-foreground/90 space-y-3">
								{exercise.passage.split(/\n\n+/).map((para, i) => (
									<p key={`p-${i}`}>{para}</p>
								))}
							</div>
						</div>

						{/* Questions */}
						<QuestionList
							questions={questions}
							answers={session.answers}
							result={session.result}
							onSelect={session.select}
							accentColor="var(--color-skill-reading)"
						/>
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className="flex items-center gap-2 border-t-2 border-border bg-surface px-4 py-2.5 shrink-0">
				<QuestionNav
					questions={questions}
					answers={session.answers}
					result={session.result}
					accentColor="var(--color-skill-reading)"
				/>
				<div className="flex-1" />
				{!session.result && (
					<button
						type="button"
						onClick={session.submit}
						disabled={session.submitting || session.answeredCount < questions.length}
						className="py-2 px-6 text-sm font-bold rounded-(--radius-button) text-primary-foreground bg-skill-reading shadow-[0_3px_0_var(--color-skill-reading-dark)] active:shadow-[0_1px_0_var(--color-skill-reading-dark)] active:translate-y-[2px] transition disabled:opacity-50 uppercase"
					>
						Nộp bài
					</button>
				)}
			</div>
		</div>
	)
}
