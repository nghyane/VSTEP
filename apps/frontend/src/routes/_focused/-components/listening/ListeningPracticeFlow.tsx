import { AlertCircleIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
	useCompletePractice,
	usePracticeSession,
	useStartPractice,
	useSubmitPracticeAnswer,
} from "@/hooks/use-practice"
import { usePresignedUrl } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { ListeningAnswerDetail } from "@/routes/_focused/-components/listening/ListeningAnswerDetail"
import { ListeningPracticeAudioBar } from "@/routes/_focused/-components/listening/ListeningAudioBar"
import {
	ListeningConversationDetail,
	ConversationTranscriptPanel,
} from "@/routes/_focused/-components/listening/ListeningConversationDetail"
import type {
	ListeningContent,
	PracticeItem,
	PracticeSession,
	PracticeStartResponse,
	PracticeSubmitResponse,
	QuestionLevel,
} from "@/types/api"

const LISTENING_PRACTICE_MODE = "free"
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

function persistSessionToUrl(sessionId: string) {
	const url = new URL(window.location.href)
	url.searchParams.set("session", sessionId)
	window.history.replaceState(null, "", url.toString())
}

function clearSessionFromUrl() {
	const url = new URL(window.location.href)
	url.searchParams.delete("session")
	window.history.replaceState(null, "", url.toString())
}

interface ListeningPracticeFlowProps {
	part?: number
	level?: QuestionLevel
	resumeSessionId?: string
}

export function ListeningPracticeFlow({
	part,
	level,
	resumeSessionId,
}: ListeningPracticeFlowProps) {
	const [session, setSession] = useState<PracticeSession | null>(null)
	const [item, setItem] = useState<PracticeItem | null>(null)
	const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
	const [phase, setPhase] = useState<
		"loading" | "answering" | "submitting" | "result" | "completed"
	>("loading")
	const [error, setError] = useState<string | null>(null)
	const [pendingNextItem, setPendingNextItem] = useState<PracticeItem | null>(null)
	const [latestScore, setLatestScore] = useState<number | null>(null)
	const [submitResult, setSubmitResult] = useState<PracticeSubmitResponse["result"] | null>(null)
	const [progress, setProgress] = useState<{
		current: number
		total: number
		hasMore: boolean
	} | null>(null)

	const hasInitRef = useRef(false)
	const startMutation = useStartPractice()
	const submitMutation = useSubmitPracticeAnswer(session?.id ?? "")
	const completeMutation = useCompletePractice(session?.id ?? "")

	const {
		data: resumeData,
		isError: resumeFailed,
		isLoading: resumeLoading,
	} = usePracticeSession(resumeSessionId && !session ? resumeSessionId : null)

	useEffect(() => {
		if (hasInitRef.current || session) return
		if (resumeSessionId && resumeLoading) return

		if (resumeData && !resumeData.session.completedAt) {
			if (!resumeData.currentItem) {
				clearSessionFromUrl()
				setError("Phiên luyện nghe này không còn bài hợp lệ. Vui lòng tạo phiên mới.")
				setPhase("loading")
				return
			}

			hasInitRef.current = true
			setSession(resumeData.session)
			setItem(resumeData.currentItem)
			setSubmitResult(null)
			setProgress(resumeData.progress)
			setPhase("answering")
			return
		}

		if (!resumeSessionId || resumeFailed || resumeData?.session.completedAt) {
			hasInitRef.current = true
			if (resumeFailed) {
				clearSessionFromUrl()
			}

			startMutation.mutate(
				{
					skill: "listening",
					mode: LISTENING_PRACTICE_MODE,
					itemsCount: 2,
					part,
					level,
				},
				{
					onSuccess: (data: PracticeStartResponse) => {
						if (!data.currentItem) {
							setError("Hiện chưa có bài nghe phù hợp với trình độ của bạn. Vui lòng thử lại sau.")
							setPhase("loading")
							return
						}

						setSession(data.session)
						setItem(data.currentItem)
						setSubmitResult(null)
						setProgress(data.progress)
						setPhase("answering")
						persistSessionToUrl(data.session.id)
					},
					onError: (err) => {
						setError(err.message)
						setPhase("loading")
					},
				},
			)
		}
	}, [
		level,
		part,
		resumeData,
		resumeFailed,
		resumeLoading,
		resumeSessionId,
		session,
		startMutation,
	])

	const content = item?.question.content as ListeningContent | undefined
	const itemCount = content?.items?.length ?? 0
	const answeredCount = Object.keys(selectedAnswers).length
	const canSubmit = phase === "answering" && itemCount > 0 && answeredCount === itemCount

	const handleSelect = (itemIndex: number, optionIndex: number) => {
		if (phase !== "answering") return
		const options = content?.items[itemIndex]?.options ?? []
		const letter = LETTERS[optionIndex]
		if (!options[optionIndex] || !letter) return

		setSelectedAnswers((prev) => ({ ...prev, [String(itemIndex + 1)]: letter }))
	}

	const handleSubmit = () => {
		if (!session || !item) return
		if (!canSubmit) {
			setError("Vui lòng chọn đáp án cho tất cả câu hỏi trước khi nộp bài.")
			return
		}

		setError(null)
		setPhase("submitting")
		submitMutation.mutate(
			{ questionId: item.question.id, answer: { answers: selectedAnswers } },
			{
				onSuccess: (data) => {
					const nextItem = data.currentItem
					const isDuplicateNextItem = nextItem?.question.id === item.question.id

					setLatestScore(data.result.score ?? null)
					setSubmitResult(data.result)
					setProgress(data.progress)
					setPendingNextItem(isDuplicateNextItem ? null : nextItem)

					if (isDuplicateNextItem) {
						setPhase("completed")
						clearSessionFromUrl()
						completeMutation.mutate()
						return
					}

					if (nextItem) {
						setPhase("result")
						return
					}

					setPhase("completed")
					clearSessionFromUrl()
					completeMutation.mutate()
				},
				onError: (err) => {
					setError(err.message)
					setPhase("answering")
				},
			},
		)
	}

	const handleContinue = () => {
		if (!pendingNextItem) return
		setItem(pendingNextItem)
		setPendingNextItem(null)
		setSelectedAnswers({})
		setLatestScore(null)
		setSubmitResult(null)
		setPhase("answering")
		window.scrollTo({ top: 0, behavior: "smooth" })
	}

	const title = item?.question.topic ?? `Listening Part ${item?.question.part ?? part ?? ""}`
	const questionLevel = item?.question.level ?? level

	if (error) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
				<div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
					<HugeiconsIcon icon={AlertCircleIcon} className="size-7" />
				</div>
				<div className="space-y-2">
					<h2 className="text-lg font-semibold text-destructive">Không thể tạo phiên luyện tập</h2>
					<p className="max-w-xl text-sm text-muted-foreground">{error}</p>
				</div>
				<Button
					variant="outline"
					onClick={() => {
						clearSessionFromUrl()
						setError(null)
						setSession(null)
						setItem(null)
						setPendingNextItem(null)
						setSelectedAnswers({})
						hasInitRef.current = false
						setPhase("loading")
					}}
				>
					Thử lại
				</Button>
			</div>
		)
	}

	if (phase === "loading" || !item || !content) {
		return <ListeningPracticeLoader />
	}

	if (phase === "completed") {
		return (
			<ListeningCompletedView
				content={content}
				selectedAnswers={selectedAnswers}
				submitResult={submitResult}
				latestScore={latestScore}
				progress={progress}
				questionPart={item?.question.part}
			/>
		)
	}

	const isResultPhase = phase === "result"

	return (
		<div className="flex h-full flex-col overflow-hidden">
			{/* Header bar */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="space-y-1">
					<p className="text-sm font-semibold">{title}</p>
					<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
						<Badge variant="outline">Part {item.question.part}</Badge>
						{questionLevel && <Badge variant="secondary">{questionLevel}</Badge>}
						<span>{itemCount} câu</span>
						{progress && (
							<span>
								Tiến độ {progress.current}/{progress.total}
							</span>
						)}
					</div>
				</div>
				<div className="text-sm text-muted-foreground">
					Đã chọn {answeredCount}/{itemCount} câu
				</div>
			</div>

			{/* Questions area */}
			<div className="flex-1 overflow-y-auto">
				<div className="mx-auto max-w-3xl space-y-6 p-6">
					{content.items.map((mcq, index) => {
						const key = String(index + 1)
						const selected = selectedAnswers[key] ?? null
						const resultItem = submitResult?.items?.find((ri) => ri.questionNumber === index + 1)
						const showResult = isResultPhase && resultItem != null

						return (
							<div
								key={`${item.question.id}-${index}`}
								id={`listening-item-${index}`}
								className="space-y-2"
							>
								<p className="text-sm font-medium">
									<span className="mr-1.5 text-primary">{index + 1}.</span>
									{mcq.stem}
								</p>
								<div className="grid gap-2 sm:grid-cols-2">
									{mcq.options.map((option, optionIndex) => {
										const letter = LETTERS[optionIndex] ?? String(optionIndex)
										const isSelected = selected === letter
										const isCorrectOption = showResult && resultItem.correctAnswer === letter
										const isWrongSelected = showResult && isSelected && !resultItem.isCorrect

										let optionClass = "border-border hover:border-primary/40"
										if (isSelected && !showResult) {
											optionClass = "border-primary bg-primary/5 ring-1 ring-primary/20"
										}
										if (isCorrectOption) {
											optionClass =
												"border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
										}
										if (isWrongSelected) {
											optionClass =
												"border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
										}

										return (
											<button
												key={`${item.question.id}-${index}-${letter}`}
												type="button"
												onClick={() => handleSelect(index, optionIndex)}
												disabled={phase !== "answering"}
												className={cn(
													"flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-all",
													optionClass,
													phase !== "answering" && "cursor-not-allowed opacity-80",
												)}
											>
												<span
													className={cn(
														"flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
														isCorrectOption
															? "bg-green-500 text-white"
															: isWrongSelected
																? "bg-red-500 text-white"
																: isSelected
																	? "bg-primary text-primary-foreground"
																	: "bg-muted text-muted-foreground",
													)}
												>
													{letter}
												</span>
												<span>{option}</span>
											</button>
										)
									})}
								</div>
							</div>
						)
					})}

					{/* Result summary inline */}
					{isResultPhase && submitResult && (
						<div className="rounded-xl border border-green-200 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-950/20">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-semibold">Kết quả</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										Đúng{" "}
										<span className="font-semibold text-green-600">
											{submitResult.items?.filter((i) => i.isCorrect).length ?? 0}/
											{submitResult.total ?? itemCount}
										</span>{" "}
										câu
										{latestScore != null && (
											<>
												{" "}
												· Điểm:{" "}
												<span className="font-semibold text-green-600">
													{latestScore.toFixed(1)}/10
												</span>
											</>
										)}
									</p>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Audio bar */}
			<ListeningAudioBarWithPresign audioUrl={content.audioUrl} />

			{/* Question number navigation */}
			<div className="flex flex-wrap justify-center gap-1.5 border-t px-4 py-2.5">
				{content.items.map((_, index) => {
					const key = String(index + 1)
					const isAnswered = selectedAnswers[key] != null
					const resultItem = submitResult?.items?.find((ri) => ri.questionNumber === index + 1)
					const showResult = isResultPhase && resultItem != null

					let pillClass = "border-border bg-background text-muted-foreground hover:bg-accent"
					if (showResult) {
						pillClass = resultItem.isCorrect
							? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
							: "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
					} else if (isAnswered) {
						pillClass = "border-primary bg-primary text-primary-foreground"
					}

					return (
						<button
							key={index}
							type="button"
							onClick={() =>
								document
									.getElementById(`listening-item-${index}`)
									?.scrollIntoView({ behavior: "smooth", block: "center" })
							}
							className={cn(
								"flex size-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
								pillClass,
							)}
						>
							{index + 1}
						</button>
					)
				})}
			</div>

			{/* Footer */}
			<footer className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-t px-4 py-3">
				<div className="text-sm text-muted-foreground">
					{isResultPhase && latestScore !== null
						? `Điểm bài vừa nộp: ${latestScore.toFixed(1)}/10`
						: null}
				</div>

				{phase === "answering" && (
					<Button
						size="lg"
						className="rounded-xl px-8"
						onClick={handleSubmit}
						disabled={!canSubmit}
					>
						Nộp bài
					</Button>
				)}

				{phase === "submitting" && (
					<Button size="lg" className="rounded-xl px-8" disabled>
						Đang nộp...
					</Button>
				)}

				{isResultPhase && (
					<Button
						size="lg"
						className="rounded-xl px-8"
						onClick={handleContinue}
						disabled={!pendingNextItem}
					>
						Tiếp tục
						<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
					</Button>
				)}
			</footer>
		</div>
	)
}

// ═══════════════════════════════════════════════════
// Completed view — uses rich grading UI components
// ═══════════════════════════════════════════════════

/** Convert practice API data → ExamQuestion[] for the grading UI components */
function toExamQuestions(
	content: ListeningContent,
	submitResult: PracticeSubmitResponse["result"] | null,
): import("@/routes/_learner/practice/-components/mock-data").ExamQuestion[] {
	return content.items.map((mcq, i) => {
		const num = i + 1
		const resultItem = submitResult?.items?.find((ri) => ri.questionNumber === num)
		return {
			questionNumber: num,
			questionText: mcq.stem,
			options: Object.fromEntries(mcq.options.map((opt, j) => [LETTERS[j] ?? String(j), opt])),
			correctAnswer: resultItem?.correctAnswer ?? "A",
		}
	})
}

/** Convert selectedAnswers (string keys) → Record<number, string> for grading UI */
function toAnswersRecord(selectedAnswers: Record<string, string>): Record<number, string> {
	return Object.fromEntries(Object.entries(selectedAnswers).map(([k, v]) => [Number(k), v]))
}

function ListeningCompletedView({
	content,
	selectedAnswers,
	submitResult,
	latestScore,
	progress,
	questionPart,
}: {
	content: ListeningContent
	selectedAnswers: Record<string, string>
	submitResult: PracticeSubmitResponse["result"] | null
	latestScore: number | null
	progress: { current: number; total: number; hasMore: boolean } | null
	questionPart?: number
}) {
	const [highlightIndex, setHighlightIndex] = useState<number | null>(null)

	const examQuestions = toExamQuestions(content, submitResult)
	const answersRecord = toAnswersRecord(selectedAnswers)

	const isConversation = questionPart === 2
	const examId = `listen-${questionPart ?? 1}`

	const sentences = content.transcript
		? content.transcript.split(/(?<=\.)\s+/).filter((s) => s.trim().length > 0)
		: []

	return (
		<div className="flex h-full flex-col overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="space-y-1">
					<p className="text-base font-semibold">Hoàn thành phiên luyện nghe</p>
					<p className="text-sm text-muted-foreground">
						Bạn đã hoàn thành {progress?.current ?? progress?.total ?? 0}/{progress?.total ?? 0} bài
						nghe.
						{latestScore != null && (
							<>
								{" "}
								· Điểm:{" "}
								<span className="font-semibold text-green-600">
									{latestScore.toFixed(1)}/10
								</span>
							</>
						)}
					</p>
				</div>
				<Button asChild>
					<Link to="/practice/listening">Quay lại phòng luyện nghe</Link>
				</Button>
			</div>

			{/* Main body: left transcript / conversation + right grading detail */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left panel — Transcript or Conversation */}
				<div className="w-1/2 overflow-y-auto border-r bg-muted/5">
					{isConversation ? (
						<ConversationTranscriptPanel
							examId={examId}
							highlightMessageIndex={highlightIndex}
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
												highlightIndex !== null
													? highlightIndex === i
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

				{/* Right panel — Rich grading UI */}
				<div className="flex-1 overflow-hidden">
					{isConversation ? (
						<ListeningConversationDetail
							examId={examId}
							questions={examQuestions}
							answers={answersRecord}
							onHighlightMessage={setHighlightIndex}
						/>
					) : (
						<ListeningAnswerDetail
							examId={examId}
							questions={examQuestions}
							answers={answersRecord}
							onHighlightSentence={setHighlightIndex}
						/>
					)}
				</div>
			</div>

			{/* Audio bar at bottom */}
			<ListeningAudioBarWithPresign audioUrl={content.audioUrl} />
		</div>
	)
}

// ═══════════════════════════════════════════════════
// Audio bar wrapper with presigned URL resolution
// ═══════════════════════════════════════════════════

function ListeningAudioBarWithPresign({ audioUrl }: { audioUrl: string }) {
	const { data: resolvedUrl } = usePresignedUrl(audioUrl)
	return <ListeningPracticeAudioBar src={resolvedUrl ?? ""} />
}

// ═══════════════════════════════════════════════════
// Loading skeleton
// ═══════════════════════════════════════════════════

function ListeningPracticeLoader() {
	return (
		<div className="flex h-full flex-col overflow-hidden">
			<div className="border-b px-4 py-3">
				<Skeleton className="h-5 w-48" />
				<Skeleton className="mt-2 h-4 w-32" />
			</div>
			<div className="flex-1 space-y-6 p-6">
				{Array.from({ length: 4 }).map((_, index) => (
					<div key={index} className="space-y-2">
						<Skeleton className="h-4 w-64" />
						<div className="grid gap-2 sm:grid-cols-2">
							{Array.from({ length: 4 }).map((__, optionIndex) => (
								<Skeleton key={optionIndex} className="h-12 w-full rounded-xl" />
							))}
						</div>
					</div>
				))}
			</div>
			<div className="border-t px-4 py-3">
				<Skeleton className="h-6 w-full rounded-full" />
			</div>
		</div>
	)
}
