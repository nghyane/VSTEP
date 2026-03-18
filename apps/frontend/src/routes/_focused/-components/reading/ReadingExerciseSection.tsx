import { useState } from "react"
import { cn } from "@/lib/utils"
import type { ReadingExam } from "@/routes/_learner/practice/-components/mock-data"
import { McqOption, type getAllQuestions } from "@/routes/_focused/-components/shared/exercise-shared"
import { ReadingAnswerDetail } from "@/routes/_focused/-components/reading/ReadingAnswerDetail"

export function ReadingExerciseSection({
	exam,
	examId,
	questions,
	selectedAnswers,
	submitted,
	onSelect,
}: {
	exam: ReadingExam
	examId: string
	questions: ReturnType<typeof getAllQuestions>
	selectedAnswers: Record<number, string>
	submitted: boolean
	onSelect: (questionNumber: number, letter: string) => void
}) {
	const [highlightParagraphIndex, setHighlightParagraphIndex] = useState<number | null>(null)

	return (
		<div className="flex flex-1 overflow-hidden">
			{/* Left — passage with dimming */}
			<div className="w-1/2 overflow-y-auto border-r">
				<div className="p-6">
					{exam.passages.map((passage) => (
						<div key={passage.passageNumber}>
							{passage.title && <h3 className="mb-4 text-lg font-bold">{passage.title}</h3>}
							<div className="space-y-4">
								{passage.content.split("\n\n").map((para, i) => (
									<p
										key={i}
										className={cn(
											"text-sm leading-relaxed transition-all duration-300",
											highlightParagraphIndex !== null &&
												highlightParagraphIndex !== i &&
												"opacity-15 blur-[0.5px]",
											highlightParagraphIndex === i &&
												"-ml-3 rounded-r-lg border-l-[3px] border-primary bg-primary/5 py-2 pl-3",
										)}
										style={{ whiteSpace: "pre-wrap" }}
									>
										{para}
									</p>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
			{/* Right — questions or answer detail */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{!submitted ? (
					<div className="flex-1 overflow-y-auto p-6">
						<div className="space-y-4">
							{exam.passages
								.flatMap((p) => p.questions)
								.map((q) => (
									<div key={q.questionNumber} className="space-y-2">
										<p className="text-sm font-medium">
											Câu {q.questionNumber}.{q.questionText ? ` ${q.questionText}` : ""}
										</p>
										<div className="grid grid-cols-1 gap-2">
											{Object.entries(q.options).map(([letter, text]) => (
												<McqOption
													key={letter}
													letter={letter}
													text={text}
													isSelected={selectedAnswers[q.questionNumber] === letter}
													isCorrect={submitted && q.correctAnswer === letter}
													isWrong={
														submitted &&
														selectedAnswers[q.questionNumber] === letter &&
														q.correctAnswer !== letter
													}
													submitted={submitted}
													onSelect={() => onSelect(q.questionNumber, letter)}
												/>
											))}
										</div>
									</div>
								))}
						</div>
					</div>
				) : (
					<ReadingAnswerDetail
						examId={examId}
						questions={questions}
						answers={selectedAnswers}
						onHighlightParagraph={setHighlightParagraphIndex}
					/>
				)}
			</div>
		</div>
	)
}
