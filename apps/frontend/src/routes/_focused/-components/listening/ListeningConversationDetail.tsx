import {
	CheckmarkCircle02Icon,
	HeadphonesIcon,
	QuoteDownIcon,
	Search01Icon,
	User03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { ExamQuestion } from "@/routes/_learner/practice/-components/mock-data"

// ═══════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════

export interface ConversationMessage {
	speaker: string
	text: string
}

interface ConversationQuestionExplanation {
	questionNumber: number
	relevantMessageIndex: number
	transcript: string
	explanation: string
}

// ═══════════════════════════════════════════════════
// Mock conversation data for listen-2
// ═══════════════════════════════════════════════════

const MOCK_CONVERSATIONS: Record<string, ConversationMessage[]> = {
	"listen-2": [
		{
			speaker: "MAN",
			text: "Sandra, I seem to remember you had some family visitors staying with you recently.",
		},
		{ speaker: "SANDRA", text: "Yeah, that's right." },
		{ speaker: "SANDRA", text: "My brother and his family were here a couple of months ago." },
		{ speaker: "MAN", text: "OK, good." },
		{ speaker: "MAN", text: "Well, I wanted to ask your advice." },
		{
			speaker: "MAN",
			text: "I've got my cousin and her family visiting next month and as I don't have kids, I've no idea where to take them.",
		},
		{ speaker: "SANDRA", text: "Right." },
		{ speaker: "SANDRA", text: "What about accommodation?" },
		{ speaker: "SANDRA", text: "Are they going to stay with you in your flat?" },
		{ speaker: "MAN", text: "No, thankfully." },
		{ speaker: "MAN", text: "There wouldn't be room." },
		{
			speaker: "SANDRA",
			text: "Well, I'd recommend the King's Hotel on George Street. It's really nice for families.",
		},
		{ speaker: "MAN", text: "How much is a family room per night?" },
		{ speaker: "SANDRA", text: "About 125 pounds, I think." },
		{
			speaker: "MAN",
			text: "OK, that sounds reasonable. What about things to do during the day?",
		},
		{
			speaker: "SANDRA",
			text: "There's a really good walking tour of the city centre. It starts in Carlton Square.",
		},
		{ speaker: "SANDRA", text: "And you could take a trip by boat to the old fort." },
		{
			speaker: "MAN",
			text: "Great, the kids would love that. What about the Science Museum?",
		},
		{ speaker: "SANDRA", text: "Oh yes, Tuesday is the best day to visit." },
		{
			speaker: "SANDRA",
			text: "And make sure you see the exhibition about space. It opens soon and it's supposed to be fantastic.",
		},
	],
}

const MOCK_CONVERSATION_EXPLANATIONS: Record<string, ConversationQuestionExplanation[]> = {
	"listen-2": [
		{
			questionNumber: 1,
			relevantMessageIndex: 11,
			transcript: "I'd recommend the King's Hotel on George Street.",
			explanation:
				"Sandra gợi ý khách sạn King's trên đường George Street. Từ khóa 'King's' là đáp án cần điền vào chỗ trống.",
		},
		{
			questionNumber: 2,
			relevantMessageIndex: 13,
			transcript: "About 125 pounds, I think.",
			explanation:
				"Chi phí phòng gia đình mỗi đêm là khoảng 125 bảng. Cần nghe chính xác con số được đề cập.",
		},
		{
			questionNumber: 3,
			relevantMessageIndex: 15,
			transcript: "There's a really good walking tour of the city centre.",
			explanation:
				"Sandra đề cập đến chuyến đi bộ tham quan trung tâm thành phố. Từ 'walking' là đáp án cần điền.",
		},
		{
			questionNumber: 4,
			relevantMessageIndex: 16,
			transcript: "You could take a trip by boat to the old fort.",
			explanation:
				"Phương tiện di chuyển đến pháo đài cổ là bằng thuyền (boat). Từ 'boat' là đáp án chính xác.",
		},
		{
			questionNumber: 5,
			relevantMessageIndex: 18,
			transcript: "Tuesday is the best day to visit.",
			explanation: "Ngày tốt nhất để tham quan Bảo tàng Khoa học là thứ Ba (Tuesday).",
		},
		{
			questionNumber: 6,
			relevantMessageIndex: 19,
			transcript: "Make sure you see the exhibition about space.",
			explanation:
				"Triển lãm được khuyên nên xem là về chủ đề không gian (space). Từ 'space' là đáp án cần điền.",
		},
	],
}

// ═══════════════════════════════════════════════════
// Chat message component
// ═══════════════════════════════════════════════════

function ChatMessage({
	text,
	isRight,
	isHighlighted,
	messageId,
}: {
	text: string
	isRight: boolean
	isHighlighted: boolean | null
	messageId?: string
}) {
	const avatar = (
		<Avatar size="sm" className="shrink-0">
			<AvatarFallback className="bg-muted">
				<HugeiconsIcon icon={User03Icon} className="size-3.5 text-muted-foreground" />
			</AvatarFallback>
		</Avatar>
	)

	return (
		<div id={messageId} className={cn("flex items-end gap-2", isRight && "flex-row-reverse")}>
			{avatar}
			<div
				className={cn(
					"rounded-2xl px-4 py-2.5 text-sm leading-relaxed transition-all duration-300",
					isRight
						? "rounded-br-md bg-muted/60 text-foreground"
						: "rounded-bl-md bg-muted/40 text-foreground",
					isHighlighted === true && "ring-2 ring-primary bg-primary/10",
					isHighlighted === false && "opacity-30",
				)}
			>
				{text}
			</div>
		</div>
	)
}

// ═══════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════

interface ListeningConversationDetailProps {
	examId: string
	questions: ExamQuestion[]
	answers: Record<number, string>
	onHighlightMessage: (messageIndex: number | null) => void
}

export function ListeningConversationDetail({
	examId,
	questions,
	answers,
	onHighlightMessage,
}: ListeningConversationDetailProps) {
	const [currentQIdx, setCurrentQIdx] = useState(0)
	const [activeHighlight, setActiveHighlight] = useState<number | null>(null)

	const explanations = MOCK_CONVERSATION_EXPLANATIONS[examId] ?? []
	const currentQ = questions[currentQIdx]
	if (!currentQ) return null

	const currentExplanation = explanations.find((e) => e.questionNumber === currentQ.questionNumber)
	const correct = questions.filter((q) => answers[q.questionNumber] === q.correctAnswer).length
	const userAnswer = answers[currentQ.questionNumber]
	const isCorrectAnswer = userAnswer === currentQ.correctAnswer

	const handleQuestionChange = (idx: number) => {
		setCurrentQIdx(idx)
		setActiveHighlight(null)
		onHighlightMessage(null)
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
									activeHighlight === currentExplanation.relevantMessageIndex
										? "border-primary bg-primary/10 text-primary"
										: "bg-muted/50 text-foreground hover:bg-muted",
								)}
								onClick={() => {
									const idx = currentExplanation.relevantMessageIndex
									if (activeHighlight === idx) {
										setActiveHighlight(null)
										onHighlightMessage(null)
									} else {
										setActiveHighlight(idx)
										onHighlightMessage(idx)
										document
											.getElementById(`conv-msg-${idx}`)
											?.scrollIntoView({ behavior: "smooth", block: "center" })
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

// ═══════════════════════════════════════════════════
// Conversation transcript panel (left side)
// ═══════════════════════════════════════════════════

interface ConversationTranscriptPanelProps {
	examId: string
	highlightMessageIndex: number | null
}

export function ConversationTranscriptPanel({
	examId,
	highlightMessageIndex,
}: ConversationTranscriptPanelProps) {
	const conversations = MOCK_CONVERSATIONS[examId] ?? []
	const speakers = [...new Set(conversations.map((m) => m.speaker))]
	const rightSpeaker = speakers[1] ?? ""

	if (conversations.length === 0) {
		return (
			<div className="flex h-full items-center justify-center p-6">
				<p className="text-sm text-muted-foreground">Không có dữ liệu hội thoại.</p>
			</div>
		)
	}

	return (
		<div className="p-6">
			<h3 className="mb-6 text-lg font-bold">Conversation</h3>
			<div className="space-y-4">
				{conversations.map((msg, i) => (
					<ChatMessage
						key={i}
						messageId={`conv-msg-${i}`}
						text={msg.text}
						isRight={msg.speaker === rightSpeaker}
						isHighlighted={highlightMessageIndex !== null ? highlightMessageIndex === i : null}
					/>
				))}
			</div>
		</div>
	)
}
