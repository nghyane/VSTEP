import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ListeningAnswerDetail } from "@/routes/_focused/-components/listening/ListeningAnswerDetail"
import { ListeningPracticeAudioBar } from "@/routes/_focused/-components/listening/ListeningAudioBar"
import {
	ConversationTranscriptPanel,
	ListeningConversationDetail,
} from "@/routes/_focused/-components/listening/ListeningConversationDetail"
import { ListeningKeywordsPanel } from "@/routes/_focused/-components/listening/ListeningKeywordsPanel"
import {
	type getAllQuestions,
	McqOption,
} from "@/routes/_focused/-components/shared/exercise-shared"
import type { ListeningExam } from "@/routes/_learner/practice/-components/mock-data"

export function ListeningExerciseSection({
	exam,
	examId,
	questions,
	selectedAnswers,
	submitted,
	onSelect,
	onSubmit,
}: {
	exam: ListeningExam
	examId: string
	questions: ReturnType<typeof getAllQuestions>
	selectedAnswers: Record<number, string>
	submitted: boolean
	onSelect: (questionNumber: number, letter: string) => void
	onSubmit: () => void
}) {
	const [focusedQuestion, setFocusedQuestion] = useState<number | null>(null)
	const [highlightSentenceIndex, setHighlightSentenceIndex] = useState<number | null>(null)
	const [highlightMessageIndex, setHighlightMessageIndex] = useState<number | null>(null)

	const listeningLevel = exam.level ?? 3
	const transcript = exam.sections
		.map((s) => s.transcript)
		.filter(Boolean)
		.join(" ")
	const sentences = transcript
		? transcript.split(/(?<=\.)\s+/).filter((s) => s.trim().length > 0)
		: []

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{!submitted ? (
				<>
					<div className="flex flex-1 overflow-hidden">
						{/* Questions area */}
						<div className="flex-1 overflow-y-auto">
							<div className={cn("space-y-6 p-6", listeningLevel !== 2 && "mx-auto max-w-3xl")}>
								{exam.sections.map((section) => (
									<div key={section.partNumber} className="space-y-4">
										{section.partTitle && (
											<h3 className="text-sm font-semibold">{section.partTitle}</h3>
										)}
										{section.instructions && (
											<p className="text-sm text-muted-foreground">{section.instructions}</p>
										)}
										{section.questions.map((q) => (
											<div
												key={q.questionNumber}
												id={`question-${q.questionNumber}`}
												className={cn(
													"space-y-2 rounded-xl border bg-card p-4 transition-all",
													listeningLevel === 2 &&
														focusedQuestion === q.questionNumber &&
														"ring-2 ring-sky-400/50",
												)}
												onClick={() => listeningLevel === 2 && setFocusedQuestion(q.questionNumber)}
											>
												<p className="text-sm font-medium">
													<span className="mr-1.5 text-primary">{q.questionNumber}.</span>
													{q.questionText || ""}
												</p>
												<div className="grid grid-cols-1 gap-2">
													{Object.entries(q.options).map(([letter, text]) => (
														<McqOption
															key={letter}
															letter={letter}
															text={text}
															isSelected={selectedAnswers[q.questionNumber] === letter}
															isCorrect={false}
															isWrong={false}
															submitted={false}
															onSelect={() => {
																onSelect(q.questionNumber, letter)
																if (listeningLevel === 2) setFocusedQuestion(q.questionNumber)
															}}
														/>
													))}
												</div>
											</div>
										))}
									</div>
								))}
							</div>
						</div>

						{/* Level 2: Keywords sidebar */}
						{listeningLevel === 2 && (
							<ListeningKeywordsPanel examId={examId} currentQuestion={focusedQuestion} />
						)}
					</div>

					{/* Audio bar */}
					<ListeningPracticeAudioBar src={exam.audioUrl} />

					{/* Bottom bar: question nav + submit */}
					<div className="flex h-14 shrink-0 items-center justify-between border-t px-4">
						<div />
						<div className="flex items-center gap-1.5">
							{questions.map((q) => (
								<button
									key={q.questionNumber}
									type="button"
									className={cn(
										"flex size-8 items-center justify-center rounded-lg border text-xs font-medium transition-colors",
										selectedAnswers[q.questionNumber]
											? "border-primary bg-primary text-primary-foreground"
											: "border-border bg-background text-muted-foreground hover:border-primary/40",
									)}
									onClick={() => {
										document
											.getElementById(`question-${q.questionNumber}`)
											?.scrollIntoView({ behavior: "smooth", block: "center" })
										if (listeningLevel === 2) setFocusedQuestion(q.questionNumber)
									}}
								>
									{q.questionNumber}
								</button>
							))}
						</div>
						<Button size="lg" className="rounded-xl px-8" onClick={onSubmit}>
							Nộp bài
						</Button>
					</div>
				</>
			) : (
				<>
					<div className="flex flex-1 overflow-hidden">
						{/* Left — Transcript or Conversation */}
						<div className="w-1/2 overflow-y-auto border-r">
							{exam.isConversation ? (
								<ConversationTranscriptPanel
									examId={examId}
									highlightMessageIndex={highlightMessageIndex}
								/>
							) : (
								<div className="p-6">
									<h3 className="mb-4 text-lg font-bold">Transcript</h3>
									{sentences.length > 0 ? (
										<div className="space-y-1 text-sm leading-relaxed">
											{sentences.map((sentence, i) => (
												<span
													key={i}
													className={cn(
														"inline transition-all duration-300",
														highlightSentenceIndex !== null
															? highlightSentenceIndex === i
																? "rounded bg-primary/10 px-0.5 font-medium text-primary"
																: "text-muted-foreground/50"
															: "",
													)}
												>
													{sentence}{" "}
												</span>
											))}
										</div>
									) : (
										<p className="text-sm text-muted-foreground">Không có transcript.</p>
									)}
								</div>
							)}
						</div>
						{/* Right — Answer detail */}
						<div className="flex flex-1 flex-col overflow-hidden">
							{exam.isConversation ? (
								<ListeningConversationDetail
									examId={examId}
									questions={questions}
									answers={selectedAnswers}
									onHighlightMessage={setHighlightMessageIndex}
								/>
							) : (
								<ListeningAnswerDetail
									examId={examId}
									questions={questions}
									answers={selectedAnswers}
									onHighlightSentence={setHighlightSentenceIndex}
								/>
							)}
						</div>
					</div>
					{/* Audio bar pinned at bottom */}
					<ListeningPracticeAudioBar src={exam.audioUrl} />
				</>
			)}
		</div>
	)
}
