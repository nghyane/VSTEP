import { useEffect, useState } from "react"
import { AudioBar } from "#/features/practice/components/AudioBar"
import { PracticeCompletionPopup } from "#/features/practice/components/PracticeCompletionPopup"
import { PracticeExamShell } from "#/features/practice/components/PracticeExamShell"
import { PracticeMcqResultPanel } from "#/features/practice/components/PracticeMcqResultPanel"
import { QuestionList } from "#/features/practice/components/QuestionList"
import { Subtitle } from "#/features/practice/components/Subtitle"
import { TTSAudioBar } from "#/features/practice/components/TTSAudioBar"
import type { ExerciseDetail } from "#/features/practice/types"
import { useListeningSession } from "#/features/practice/use-listening-session"
import { useTTSPlayer } from "#/features/practice/use-tts-player"

interface Props {
	detail: ExerciseDetail
	sessionId: string
}

export function ListeningInProgress({ detail, sessionId }: Props) {
	const { exercise, questions } = detail
	const session = useListeningSession(sessionId)
	const [showSub, setShowSub] = useState(false)
	const [audioTime, setAudioTime] = useState(0)
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
	const [finishRequested, setFinishRequested] = useState(false)
	const [showCompletion, setShowCompletion] = useState(false)

	const hasAudio = !!exercise.audio_url
	const hasTTS = !hasAudio && !!exercise.transcript
	const tts = useTTSPlayer(hasTTS ? exercise.transcript : null)
	const hasSub = !!exercise.transcript || exercise.word_timestamps.length > 0
	const canFinish =
		questions.length > 0 && questions.every((question) => session.answers[question.id] !== undefined)
	const handleNext = () =>
		setCurrentQuestionIndex((index) => (questions.length > 0 ? (index + 1) % questions.length : 0))
	const handleFinish = () => {
		setFinishRequested(true)
		session.submit()
	}
	const transcriptToggle = hasSub ? (
		<button
			type="button"
			onClick={() => setShowSub((v) => !v)}
			className="btn btn-secondary min-h-10 w-40 px-4 py-2 text-sm text-muted"
		>
			{showSub ? "Ẩn lời thoại" : "Hiện lời thoại"}
		</button>
	) : null
	const topBarContent = transcriptToggle ? (
		<div className="flex items-center gap-3">{transcriptToggle}</div>
	) : null

	useEffect(() => {
		if (finishRequested && session.result) setShowCompletion(true)
	}, [finishRequested, session.result])
	const resultConfig = {
		backTo: "/luyen-tap/nghe",
		buttonClassName:
			"inline-flex items-center justify-center py-2 px-5 font-bold text-sm rounded-(--radius-button) text-primary-foreground bg-skill-listening shadow-[0_3px_0_var(--color-skill-listening-dark)] active:shadow-[0_1px_0_var(--color-skill-listening-dark)] active:translate-y-[2px] transition uppercase",
		contentId: exercise.id,
		contentType: "practice_listening_exercise",
		label: "Kết quả nghe",
	} as const

	return (
		<PracticeExamShell
			backTo="/luyen-tap/nghe"
			title="Listening"
			partLabel={`Part ${exercise.part}`}
			questions={questions}
			answers={session.answers}
			result={session.result}
			answeredCount={session.answeredCount}
			accentColor="var(--color-skill-listening)"
			primaryActionClassName="bg-skill-listening [--btn-shadow:var(--color-skill-listening-dark)]"
			onSubmit={session.result ? undefined : session.submit}
			submitting={session.submitting}
			currentQuestionIndex={currentQuestionIndex}
			onPrevious={() => setCurrentQuestionIndex((index) => Math.max(index - 1, 0))}
			onNext={handleNext}
			onFinish={handleFinish}
			canFinish={canFinish}
			finishLabel="Finish"
			onQuestionJump={setCurrentQuestionIndex}
			resultTopBarContent={transcriptToggle}
			topBarContent={topBarContent}
			rightSidebar={
				session.result ? <PracticeMcqResultPanel result={session.result} config={resultConfig} /> : undefined
			}
		>
			<div className="overflow-hidden">
				<div className="px-5 pt-5 pb-2 md:px-7">
					<div className="mb-2 flex items-center gap-3">
						<p className="text-xs font-bold uppercase tracking-[0.2em] text-skill-listening">Question set</p>
					</div>
					<h2 className="text-2xl font-extrabold text-foreground">{exercise.title}</h2>
				</div>
				<div className="space-y-6 p-5 md:p-7">
					<div className="card p-4 md:p-5">
						{hasAudio ? (
							<AudioBar src={exercise.audio_url} onTimeUpdate={setAudioTime} />
						) : hasTTS ? (
							<TTSAudioBar player={tts} />
						) : (
							<p className="text-sm italic text-muted">Không có audio</p>
						)}
					</div>
					{showSub && hasSub ? (
						<div className="px-1 md:px-0">
							<Subtitle
								exercise={exercise}
								currentTime={audioTime}
								activeWordIndex={hasTTS ? tts.activeWordIndex : undefined}
								activeTurnIndex={hasTTS ? tts.activeTurnIndex : undefined}
								turns={hasTTS ? tts.turns : undefined}
							/>
						</div>
					) : null}
					<QuestionList
						questions={questions}
						answers={session.answers}
						result={session.result}
						onSelect={session.select}
						accentColor="var(--color-skill-listening)"
						visibleQuestionIndex={currentQuestionIndex}
					/>
				</div>
			</div>
			<PracticeCompletionPopup
				open={showCompletion}
				backTo="/luyen-tap/nghe"
				onKeepReviewing={() => setShowCompletion(false)}
			/>
		</PracticeExamShell>
	)
}
