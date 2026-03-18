import {
	CheckmarkCircle02Icon,
	HeadphonesIcon,
	QuoteDownIcon,
	Search01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import type { ExamQuestion } from "@/routes/_learner/practice/-components/mock-data"

// ═══════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════

interface ListeningQuestionExplanation {
	questionNumber: number
	relevantSentenceIndex: number
	transcript: string
	explanation: string
}

// ═══════════════════════════════════════════════════
// Mock explanation data for listen-1
// ═══════════════════════════════════════════════════

const MOCK_LISTENING_EXPLANATIONS: Record<string, ListeningQuestionExplanation[]> = {
	"listen-1": [
		{
			questionNumber: 1,
			relevantSentenceIndex: 0,
			transcript: "The next train to London will depart at 4:50 from platform 3.",
			explanation:
				"Trong đoạn hội thoại, người nói đề cập rõ ràng thời gian khởi hành là 4:50. Đáp án đúng là phương án nêu đúng giờ khởi hành này.",
		},
		{
			questionNumber: 2,
			relevantSentenceIndex: 1,
			transcript: "Your booking reference number is 15FACAS.",
			explanation:
				"Mã đặt chỗ được đọc rõ ràng là 15FACAS. Cần chú ý nghe chính xác từng ký tự vì các phương án nhiễu có mã tương tự nhưng khác một vài ký tự.",
		},
		{
			questionNumber: 3,
			relevantSentenceIndex: 2,
			transcript: "If you need assistance, please press 2 on your phone.",
			explanation:
				"Hướng dẫn yêu cầu nhấn phím 2 trên điện thoại để được hỗ trợ. Các phương án khác đưa ra số phím khác nhau nhưng chỉ phím 2 là đúng theo nội dung nghe được.",
		},
		{
			questionNumber: 4,
			relevantSentenceIndex: 3,
			transcript:
				"I find rock climbing really exciting. It's much better than just riding a bicycle.",
			explanation:
				"Người nói bày tỏ quan điểm rằng leo núi thú vị hơn đạp xe. Từ khóa 'really exciting' và 'much better' cho thấy sở thích rõ ràng của người nói về môn thể thao này.",
		},
		{
			questionNumber: 5,
			relevantSentenceIndex: 4,
			transcript: "Today, I'm going to show you how to cook rice properly using a rice cooker.",
			explanation:
				"Câu mở đầu cho biết chủ đề buổi hướng dẫn là cách nấu cơm đúng cách bằng nồi cơm điện. Đây là dạng câu hỏi về chủ đề chính (main topic) của đoạn nghe.",
		},
		{
			questionNumber: 6,
			relevantSentenceIndex: 5,
			transcript: "All camera owners should register their equipment at the front desk.",
			explanation:
				"Thông báo yêu cầu tất cả chủ sở hữu máy ảnh phải đăng ký thiết bị tại quầy lễ tân. Từ khóa 'camera owners' và 'register' giúp xác định đáp án đúng.",
		},
		{
			questionNumber: 7,
			relevantSentenceIndex: 6,
			transcript:
				"This guide will help you understand how to get around using the local bus service.",
			explanation:
				"Mục đích của hướng dẫn là giúp người nghe hiểu cách di chuyển bằng dịch vụ xe buýt địa phương. Cụm từ 'get around using the local bus service' là chìa khóa để chọn đáp án.",
		},
		{
			questionNumber: 8,
			relevantSentenceIndex: 7,
			transcript: "Palace visitors are required to wear comfortable shoes for the walking tour.",
			explanation:
				"Du khách tham quan cung điện được yêu cầu mang giày thoải mái cho chuyến đi bộ tham quan. Từ 'required' cho thấy đây là yêu cầu bắt buộc, không phải gợi ý.",
		},
	],
}

// ═══════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════

interface ListeningAnswerDetailProps {
	examId: string
	questions: ExamQuestion[]
	answers: Record<number, string>
	onHighlightSentence: (sentenceIndex: number | null) => void
}

export function ListeningAnswerDetail({
	examId,
	questions,
	answers,
	onHighlightSentence,
}: ListeningAnswerDetailProps) {
	const [currentQIdx, setCurrentQIdx] = useState(0)
	const [activeHighlight, setActiveHighlight] = useState<number | null>(null)

	const explanations = MOCK_LISTENING_EXPLANATIONS[examId] ?? []
	const currentQ = questions[currentQIdx]
	if (!currentQ) return null

	const currentExplanation = explanations.find((e) => e.questionNumber === currentQ.questionNumber)
	const correct = questions.filter((q) => answers[q.questionNumber] === q.correctAnswer).length
	const userAnswer = answers[currentQ.questionNumber]
	const isCorrectAnswer = userAnswer === currentQ.correctAnswer

	const handleQuestionChange = (idx: number) => {
		setCurrentQIdx(idx)
		setActiveHighlight(null)
		onHighlightSentence(null)
	}

	return (
		<div className="flex h-full flex-col">
			{/* Scrollable content */}
			<div className="flex-1 overflow-y-auto">
				<div className="space-y-4 p-4">
					{/* Results summary */}
					<div className="rounded-xl border border-green-200 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-950/20">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-semibold">Kết quả</p>
								<p className="mt-0.5 text-xs text-muted-foreground">
									Bạn trả lời đúng{" "}
									<span className="font-semibold text-green-600">
										{correct}/{questions.length}
									</span>{" "}
									câu
								</p>
							</div>
							<span className="text-2xl font-bold text-green-600">
								{Math.round((correct / questions.length) * 100)}%
							</span>
						</div>
						<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-green-500 transition-all"
								style={{
									width: `${questions.length > 0 ? (correct / questions.length) * 100 : 0}%`,
								}}
							/>
						</div>
					</div>

					{/* Current question display */}
					<div className="rounded-xl border p-4">
						<p className="mb-3 text-sm font-semibold">
							<span
								className={cn(
									"mr-2 inline-flex size-6 items-center justify-center rounded-lg text-xs font-bold text-white",
									isCorrectAnswer ? "bg-green-500" : "bg-red-500",
								)}
							>
								{currentQ.questionNumber}
							</span>
							{currentQ.questionText || `Câu ${currentQ.questionNumber}`}
						</p>

						<div className="space-y-1.5">
							{Object.entries(currentQ.options).map(([letter, text]) => {
								const isCorrect = letter === currentQ.correctAnswer
								const isUserWrong = letter === userAnswer && !isCorrect

								let cls = "border bg-background text-foreground"
								if (isCorrect)
									cls =
										"border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
								if (isUserWrong)
									cls = "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"

								return (
									<div
										key={letter}
										className={cn(
											"flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
											cls,
										)}
									>
										<span
											className={cn(
												"flex size-5 shrink-0 items-center justify-center rounded text-[11px] font-bold text-white",
												isCorrect
													? "bg-green-500"
													: isUserWrong
														? "bg-red-500"
														: "bg-muted text-muted-foreground",
											)}
										>
											{letter}
										</span>
										<span className="text-xs">{text}</span>
										{isCorrect && (
											<HugeiconsIcon
												icon={CheckmarkCircle02Icon}
												className="ml-auto size-4 text-green-500"
											/>
										)}
									</div>
								)
							})}
						</div>
					</div>

					{/* Explanation content */}
					{currentExplanation && (
						<div className="rounded-xl border bg-background p-4">
							{/* Listen from here button */}
							<button
								type="button"
								className={cn(
									"mb-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm leading-none font-medium transition-colors",
									activeHighlight === currentExplanation.relevantSentenceIndex
										? "border-primary bg-primary/10 text-primary"
										: "bg-muted/50 text-foreground hover:bg-muted",
								)}
								onClick={() => {
									const idx = currentExplanation.relevantSentenceIndex
									if (activeHighlight === idx) {
										setActiveHighlight(null)
										onHighlightSentence(null)
									} else {
										setActiveHighlight(idx)
										onHighlightSentence(idx)
									}
								}}
							>
								<HugeiconsIcon icon={HeadphonesIcon} className="size-4 shrink-0" />
								<span className="translate-y-px">Nghe từ đây</span>
							</button>

							{/* Detailed explanation header */}
							<div className="mb-3 flex items-center gap-2 text-sm font-semibold">
								<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-green-600" />
								Giải thích chi tiết
							</div>

							{/* Transcript quote */}
							<div className="mb-3">
								<div className="flex items-start gap-1.5 text-sm">
									<HugeiconsIcon
										icon={QuoteDownIcon}
										className="mt-0.5 size-3.5 shrink-0 text-amber-500"
									/>
									<p className="italic text-muted-foreground">"{currentExplanation.transcript}"</p>
								</div>
							</div>

							{/* Explanation text */}
							<div className="mb-3 text-sm">
								<span className="text-primary">{currentExplanation.explanation}</span>
							</div>

							{/* Correct answer label */}
							<div className="flex items-center gap-2 text-sm">
								<span className="text-muted-foreground">⇒</span>
								<span className="font-medium">Đáp án đúng:</span>
								<span
									className={cn(
										"rounded-md px-2.5 py-0.5 text-xs font-bold text-white bg-green-600",
									)}
								>
									{currentQ.correctAnswer}
								</span>
							</div>
						</div>
					)}

					{/* Fallback when no explanation data */}
					{!currentExplanation && (
						<div className="rounded-xl border border-dashed p-6 text-center">
							<HugeiconsIcon
								icon={Search01Icon}
								className="mx-auto mb-2 size-8 text-muted-foreground/50"
							/>
							<p className="text-sm text-muted-foreground">
								Chưa có dữ liệu giải thích cho câu hỏi này.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Question number navigation */}
			<div className="shrink-0 border-t bg-background px-3 py-2.5">
				<div className="flex flex-wrap justify-center gap-1.5">
					{questions.map((q, i) => {
						const isCurrent = i === currentQIdx
						const isCorrect = answers[q.questionNumber] === q.correctAnswer
						const isAnswered = answers[q.questionNumber] != null

						return (
							<button
								key={q.questionNumber}
								type="button"
								onClick={() => handleQuestionChange(i)}
								className={cn(
									"flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition-all",
									isCurrent ? "ring-2 ring-primary ring-offset-1" : "",
									isAnswered
										? isCorrect
											? "border border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
											: "border border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
										: "border bg-background text-muted-foreground",
								)}
							>
								{q.questionNumber}
							</button>
						)
					})}
				</div>
			</div>
		</div>
	)
}
