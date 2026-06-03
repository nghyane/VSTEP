import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { Icon } from "#/components/Icon"
import { AudioBar } from "#/features/practice/components/AudioBar"
import { PracticeMcqResultPanel } from "#/features/practice/components/PracticeMcqResultPanel"
import { QuestionList } from "#/features/practice/components/QuestionList"
import { QuestionNav } from "#/features/practice/components/QuestionNav"
import { Subtitle } from "#/features/practice/components/Subtitle"
import { TTSAudioBar } from "#/features/practice/components/TTSAudioBar"
import type { ExerciseDetail } from "#/features/practice/types"
import { useListeningSession } from "#/features/practice/use-listening-session"
import { useTTSPlayer } from "#/features/practice/use-tts-player"
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

	const hasAudio = !!exercise.audio_url
	const hasTTS = !hasAudio && !!exercise.transcript
	const tts = useTTSPlayer(hasTTS ? exercise.transcript : null)
	const hasSub = !!exercise.transcript || exercise.word_timestamps.length > 0
	const resultConfig = {
		backTo: "/luyen-tap/nghe",
		buttonClassName:
			"inline-flex items-center justify-center py-2 px-5 font-bold text-sm rounded-(--radius-button) text-primary-foreground bg-skill-listening shadow-[0_3px_0_var(--color-skill-listening-dark)] active:shadow-[0_1px_0_var(--color-skill-listening-dark)] active:translate-y-[2px] transition uppercase",
		contentId: exercise.id,
		contentType: "practice_listening_exercise",
		label: "Kết quả nghe",
	} as const
	const audioPanel = (
		<div className="card p-4">
			<p className="text-xs font-bold text-skill-listening uppercase tracking-wide mb-2">
				Part {exercise.part}
			</p>
			<h2 className="font-bold text-lg text-foreground mb-1">{exercise.title}</h2>
			{exercise.description && <p className="text-sm text-muted mb-4">{exercise.description}</p>}
			<div className="flex items-center gap-3">
				<div className="flex-1 min-w-0">
					{hasAudio ? (
						<AudioBar src={exercise.audio_url} onTimeUpdate={setAudioTime} />
					) : hasTTS ? (
						<TTSAudioBar player={tts} />
					) : (
						<p className="text-sm text-muted italic">Không có audio</p>
					)}
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
	)

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

			{/* Subtitle panel */}
			{showSub && hasSub && (
				<div className="bg-surface border-b border-border px-6 py-3 shrink-0 overflow-y-auto max-h-[40vh]">
					<div className="max-w-3xl mx-auto">
						<Subtitle
							exercise={exercise}
							currentTime={audioTime}
							activeWordIndex={hasTTS ? tts.activeWordIndex : undefined}
							activeTurnIndex={hasTTS ? tts.activeTurnIndex : undefined}
							turns={hasTTS ? tts.turns : undefined}
						/>
					</div>
				</div>
			)}

			{/* Scrollable content */}
			<div className="flex-1 overflow-y-auto">
				<div className="mx-auto max-w-5xl px-6 py-6">
					{session.result ? (
						<div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
							<div className="lg:sticky lg:top-6">
								<PracticeMcqResultPanel result={session.result} config={resultConfig} />
							</div>
							<div className="space-y-6">
								{audioPanel}
								<QuestionList
									questions={questions}
									answers={session.answers}
									result={session.result}
									onSelect={session.select}
									accentColor="var(--color-skill-listening)"
								/>
							</div>
						</div>
					) : (
						<div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
							<div className="lg:sticky lg:top-6">{audioPanel}</div>
							<QuestionList
								questions={questions}
								answers={session.answers}
								result={session.result}
								onSelect={session.select}
								accentColor="var(--color-skill-listening)"
							/>
						</div>
					)}
				</div>
			</div>

			{/* Footer */}
			<div className="flex items-center gap-2 border-t-2 border-border bg-surface px-4 py-2.5 shrink-0">
				<QuestionNav
					questions={questions}
					answers={session.answers}
					result={session.result}
					accentColor="var(--color-skill-listening)"
				/>
				<div className="flex-1" />
				{!session.result && (
					<button
						type="button"
						onClick={session.submit}
						disabled={session.submitting || session.answeredCount < questions.length}
						className="py-2 px-6 text-sm font-bold rounded-(--radius-button) text-primary-foreground bg-skill-listening shadow-[0_3px_0_var(--color-skill-listening-dark)] active:shadow-[0_1px_0_var(--color-skill-listening-dark)] active:translate-y-[2px] transition disabled:opacity-50 uppercase"
					>
						Nộp bài
					</button>
				)}
			</div>
		</div>
	)
}
