import { useEffect, useState } from "react"
import { HighlightablePassage, PassageSpeechControl } from "#/features/exam/components/HighlightablePassage"
import { PracticeCompletionPopup } from "#/features/practice/components/PracticeCompletionPopup"
import { PracticeExamShell } from "#/features/practice/components/PracticeExamShell"
import { PracticeMcqResultPanel } from "#/features/practice/components/PracticeMcqResultPanel"
import { QuestionList } from "#/features/practice/components/QuestionList"
import { TranslateSelection } from "#/features/practice/components/TranslateSelection"
import { TTSVoicePicker } from "#/features/practice/components/TTSVoicePicker"
import type { ReadingExerciseDetail } from "#/features/practice/types"
import type { McqPracticeSession } from "#/features/practice/use-mcq-session"
import { pickBoundaryEnglishVoice, stopSpeaking } from "#/lib/utils"

interface Props {
	detail: ReadingExerciseDetail
	session: McqPracticeSession
}

export function ReadingInProgress({ detail, session }: Props) {
	const { exercise, questions } = detail
	const [activeCharIndex, setActiveCharIndex] = useState<number | null>(null)
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
	const [finishRequested, setFinishRequested] = useState(false)
	const [showCompletion, setShowCompletion] = useState(false)
	const [voice, setVoice] = useState<SpeechSynthesisVoice | undefined>(() => pickBoundaryEnglishVoice())
	const canFinish = questions.every((question) => session.answers[question.id] !== undefined)
	const handleNext = () => setCurrentQuestionIndex((index) => (index + 1) % questions.length)
	const handleVoiceChange = (nextVoice: SpeechSynthesisVoice) => {
		stopSpeaking()
		setActiveCharIndex(null)
		setVoice(nextVoice)
	}
	const handleFinish = () => {
		setFinishRequested(true)
		session.submit()
	}

	useEffect(() => {
		if (finishRequested && session.result) setShowCompletion(true)
	}, [finishRequested, session.result])
	const resultConfig = {
		backTo: "/luyen-tap/doc",
		buttonClassName:
			"inline-flex items-center justify-center py-2 px-5 font-bold text-sm rounded-(--radius-button) text-primary-foreground bg-skill-reading shadow-[0_3px_0_var(--color-skill-reading-dark)] active:shadow-[0_1px_0_var(--color-skill-reading-dark)] active:translate-y-[2px] transition uppercase",
		contentId: exercise.id,
		contentType: "practice_reading_exercise",
		label: "Kết quả đọc",
	} as const

	return (
		<PracticeExamShell
			backTo="/luyen-tap/doc"
			title="Reading"
			partLabel={`Part ${exercise.part}`}
			questions={questions}
			answers={session.answers}
			result={session.result}
			answeredCount={session.answeredCount}
			accentColor="var(--color-skill-reading)"
			primaryActionClassName="bg-skill-reading [--btn-shadow:var(--color-skill-reading-dark)]"
			onSubmit={session.result ? undefined : session.submit}
			submitting={session.submitting}
			currentQuestionIndex={currentQuestionIndex}
			onPrevious={() => setCurrentQuestionIndex((index) => Math.max(index - 1, 0))}
			onNext={handleNext}
			onFinish={handleFinish}
			canFinish={canFinish}
			finishLabel="Finish"
			onQuestionJump={setCurrentQuestionIndex}
			topBarContent={
				<TTSVoicePicker
					voice={voice}
					onVoiceChange={handleVoiceChange}
					accentClassName="border-skill-reading text-skill-reading"
				/>
			}
			rightSidebar={
				session.result ? <PracticeMcqResultPanel result={session.result} config={resultConfig} /> : undefined
			}
		>
			<div className="overflow-hidden">
				<div className="px-5 pt-5 pb-2 md:px-7">
					<div className="mb-2 flex items-center justify-between gap-3">
						<p className="text-xs font-bold uppercase tracking-[0.2em] text-skill-reading">Reading passage</p>
						<PassageSpeechControl
							text={exercise.passage}
							onActiveCharChange={setActiveCharIndex}
							voice={voice}
							onVoiceChange={handleVoiceChange}
							showVoicePicker={false}
						/>
					</div>
					<h2 className="text-2xl font-extrabold text-foreground">{exercise.title}</h2>
				</div>
				<div className="space-y-6 p-5 md:p-7">
					<TranslateSelection>
						<HighlightablePassage
							text={exercise.passage}
							passageId={exercise.id}
							activeCharIndex={activeCharIndex}
							className="text-sm leading-relaxed text-foreground/90"
						/>
					</TranslateSelection>
					<QuestionList
						questions={questions}
						answers={session.answers}
						result={session.result}
						onSelect={session.select}
						accentColor="var(--color-skill-reading)"
						visibleQuestionIndex={currentQuestionIndex}
					/>
				</div>
			</div>
			<PracticeCompletionPopup
				open={showCompletion}
				backTo="/luyen-tap/doc"
				onKeepReviewing={() => setShowCompletion(false)}
			/>
		</PracticeExamShell>
	)
}
