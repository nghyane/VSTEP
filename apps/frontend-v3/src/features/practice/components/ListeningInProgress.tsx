import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { Icon } from "#/components/Icon"
import { AudioBar } from "#/features/practice/components/AudioBar"
import { QuestionList } from "#/features/practice/components/QuestionList"
import { QuestionNav } from "#/features/practice/components/QuestionNav"
import { Subtitle } from "#/features/practice/components/Subtitle"
import type { ExerciseDetail } from "#/features/practice/types"
import { useListeningSession } from "#/features/practice/use-listening-session"
import { cn } from "#/lib/utils"

interface Props {
	detail: ExerciseDetail
	sessionId: string
}

export function ListeningInProgress({ detail, sessionId }: Props) {
	const { exercise, questions } = detail
	const session = useListeningSession(sessionId)
	const [showSub, setShowSub] = useState(false)
	const [audioTime, setAudioTime] = useState(0)
	const hasSub = !!exercise.transcript || exercise.word_timestamps.length > 0

	return (
		<div className="flex flex-col h-screen bg-background">
			{/* Header */}
			<div className="flex items-center gap-3 border-b-2 border-border bg-surface px-4 py-2.5 shrink-0">
				<Link to="/luyen-tap/nghe" className="p-1 hover:opacity-70 shrink-0">
					<Icon name="close" size="xs" className="text-muted" />
				</Link>
				<div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
					<div
						className="h-full bg-skill-listening rounded-full transition-all"
						style={{ width: `${(session.answeredCount / questions.length) * 100}%` }}
					/>
				</div>
				<span className="text-xs font-bold text-muted shrink-0">
					{session.answeredCount}/{questions.length}
				</span>
			</div>

			{/* Sticky subtitle */}
			{showSub && hasSub && (
				<div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-2.5 shrink-0">
					<div className="max-w-3xl mx-auto">
						<Subtitle exercise={exercise} currentTime={audioTime} />
					</div>
				</div>
			)}

			{/* Scrollable content */}
			<div className="flex-1 overflow-y-auto">
				<div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
					{/* Audio card */}
					<div className="card p-4">
						<p className="text-xs font-bold text-skill-listening uppercase tracking-wide mb-2">
							Part {exercise.part}
						</p>
						<h2 className="font-bold text-lg text-foreground mb-1">{exercise.title}</h2>
						{exercise.description && <p className="text-sm text-muted mb-4">{exercise.description}</p>}
						<div className="flex items-center gap-3">
							<div className="flex-1 min-w-0">
								<AudioBar src={exercise.audio_url} onTimeUpdate={setAudioTime} />
							</div>
							{hasSub && (
								<button
									type="button"
									onClick={() => setShowSub((v) => !v)}
									className={cn(
										"w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition shrink-0",
										showSub
											? "border-skill-listening bg-info-tint text-skill-listening"
											: "border-border text-muted",
									)}
									aria-label="Bật/tắt phụ đề"
								>
									CC
								</button>
							)}
						</div>
					</div>

					{/* Celebration */}
					{session.result && (
						<div className="card p-6 text-center">
							<img src="/mascot/lac-happy.png" alt="" className="w-20 h-20 mx-auto mb-3 object-contain" />
							<p className="font-extrabold text-2xl text-foreground">
								{session.result.score}/{session.result.total}
							</p>
							<p className="text-sm text-muted mt-1">câu đúng</p>
							<div className="flex justify-center gap-3 mt-4">
								<Link
									to="/luyen-tap/nghe"
									className="py-2 px-5 font-bold text-sm rounded-(--radius-button) text-primary-foreground bg-skill-listening shadow-[0_3px_0_oklch(0.45_0.15_240)] uppercase"
								>
									Về danh sách
								</Link>
							</div>
						</div>
					)}

					{/* Questions */}
					<QuestionList
						questions={questions}
						answers={session.answers}
						result={session.result}
						onSelect={session.select}
					/>
				</div>
			</div>

			{/* Footer */}
			<div className="flex items-center gap-2 border-t-2 border-border bg-surface px-4 py-2.5 shrink-0">
				<QuestionNav questions={questions} answers={session.answers} result={session.result} />
				<div className="flex-1" />
				{!session.result && (
					<button
						type="button"
						onClick={session.submit}
						disabled={session.submitting || session.answeredCount < questions.length}
						className="py-2 px-6 text-sm font-bold rounded-(--radius-button) text-primary-foreground bg-skill-listening shadow-[0_3px_0_oklch(0.45_0.15_240)] active:shadow-[0_1px_0_oklch(0.45_0.15_240)] active:translate-y-[2px] transition disabled:opacity-50 uppercase"
					>
						Nộp bài
					</button>
				)}
			</div>
		</div>
	)
}
