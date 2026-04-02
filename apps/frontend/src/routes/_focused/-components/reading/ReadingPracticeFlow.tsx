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
import { cn } from "@/lib/utils"
import { ReadingAnswerDetail } from "@/routes/_focused/-components/reading/ReadingAnswerDetail"
import type { ExamQuestion } from "@/routes/_learner/practice/-components/mock-data"
import type {
	PracticeItem,
	PracticeSession,
	PracticeStartResponse,
	QuestionContent,
	QuestionLevel,
	ReadingContent,
	ReadingGapFillContent,
	ReadingMatchingContent,
	ReadingTNGContent,
} from "@/types/api"

const READING_PRACTICE_MODE = "free"

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

function isReadingPassageContent(c: QuestionContent): c is ReadingContent | ReadingTNGContent {
	return "passage" in c && "items" in c
}

function isReadingGapFillContent(c: QuestionContent): c is ReadingGapFillContent {
	return "textWithGaps" in c
}

function isReadingMatchingContent(c: QuestionContent): c is ReadingMatchingContent {
	return "paragraphs" in c && "headings" in c
}

function getItemCount(content: QuestionContent): number {
	if (isReadingPassageContent(content)) return content.items.length
	if (isReadingGapFillContent(content)) return content.items.length
	if (isReadingMatchingContent(content)) return content.paragraphs.length
	return 0
}

function getItemStem(content: QuestionContent, index: number): string {
	if (isReadingPassageContent(content)) return content.items[index]?.stem ?? ""
	if (isReadingGapFillContent(content)) return `Gap ${index + 1}`
	if (isReadingMatchingContent(content)) {
		const para = content.paragraphs[index]
		return para ? `${para.label}. ${para.text}` : ""
	}
	return ""
}

function getItemOptions(content: QuestionContent, index: number): string[] {
	if (isReadingPassageContent(content)) return content.items[index]?.options ?? []
	if (isReadingGapFillContent(content)) return content.items[index]?.options ?? []
	if (isReadingMatchingContent(content)) return content.headings
	return []
}

function getPassageBody(content: QuestionContent): string[] {
	if (isReadingPassageContent(content)) {
		return content.passage.split("\n\n").filter((para) => para.trim().length > 0)
	}

	if (isReadingGapFillContent(content)) {
		return content.textWithGaps.split("\n\n").filter((para) => para.trim().length > 0)
	}

	if (isReadingMatchingContent(content)) {
		return content.paragraphs.map((para) => `${para.label}. ${para.text}`)
	}

	return []
}

function buildMockReviewQuestions(content: QuestionContent): ExamQuestion[] {
	return Array.from({ length: getItemCount(content) }, (_, index) => ({
		questionNumber: index + 1,
		questionText: getItemStem(content, index),
		options: Object.fromEntries(
			getItemOptions(content, index).map((option, optionIndex) => [
				String.fromCharCode(65 + optionIndex),
				option,
			]),
		),
		correctAnswer: "A",
	}))
}

interface ReadingPracticeFlowProps {
	part?: number
	level?: QuestionLevel
	resumeSessionId?: string
}

export function ReadingPracticeFlow({ part, level, resumeSessionId }: ReadingPracticeFlowProps) {
	const [session, setSession] = useState<PracticeSession | null>(null)
	const [item, setItem] = useState<PracticeItem | null>(null)
	const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
	const [phase, setPhase] = useState<
		"loading" | "answering" | "submitting" | "result" | "completed"
	>("loading")
	const [error, setError] = useState<string | null>(null)
	const [pendingNextItem, setPendingNextItem] = useState<PracticeItem | null>(null)
	const [latestScore, setLatestScore] = useState<number | null>(null)
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
				setError("Phiên luyện đọc này không còn bài hợp lệ. Vui lòng tạo phiên mới.")
				setPhase("loading")
				return
			}

			hasInitRef.current = true
			setSession(resumeData.session)
			setItem(resumeData.currentItem)
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
				{ skill: "reading", mode: READING_PRACTICE_MODE, itemsCount: 1, part, level },
				{
					onSuccess: (data: PracticeStartResponse) => {
						if (!data.currentItem) {
							setError("Hiện chưa có bài đọc phù hợp với trình độ của bạn. Vui lòng thử lại sau.")
							setPhase("loading")
							return
						}

						setSession(data.session)
						setItem(data.currentItem)
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

	const content = item?.question.content
	const itemCount = content ? getItemCount(content) : 0
	const answeredCount = Object.keys(selectedAnswers).length
	const canSubmit = phase === "answering" && itemCount > 0 && answeredCount === itemCount

	const handleSelect = (itemIndex: number, optionIndex: number) => {
		if (phase !== "answering") return
		const options = content ? getItemOptions(content, itemIndex) : []
		const letter = String.fromCharCode(65 + optionIndex)
		if (!options[optionIndex]) return

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
		setPhase("answering")
		window.scrollTo({ top: 0, behavior: "smooth" })
	}

	const title = item?.question.topic ?? `Reading Part ${item?.question.part ?? part ?? ""}`
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
		return <ReadingPracticeLoader />
	}

	if (phase === "completed") {
		const mockQuestions = buildMockReviewQuestions(content)
		const estimatedCorrectCount = latestScore !== null ? Math.round((latestScore / 10) * itemCount) : 0
		const practiceAnswers = Object.fromEntries(
			Object.entries(selectedAnswers).map(([key, value]) => [Number(key), value]),
		)

		return (
			<div className="flex h-full flex-col overflow-hidden">
				<div className="flex items-center justify-between border-b px-4 py-3">
					<div className="space-y-1">
						<p className="text-base font-semibold">Hoàn thành phiên luyện đọc</p>
						<p className="text-sm text-muted-foreground">
							Bạn đã hoàn thành {progress?.current ?? progress?.total ?? 0}/{progress?.total ?? 0} bài đọc.
						</p>
					</div>
					<Button asChild>
						<Link to="/practice/reading">Quay lại phòng luyện đọc</Link>
					</Button>
				</div>

				<div className="flex flex-1 overflow-hidden">
					<div className="w-1/2 overflow-y-auto border-r bg-muted/5 p-6">
						{"title" in content && content.title ? (
							<h3 className="mb-4 text-lg font-bold">{content.title}</h3>
						) : null}
						<div className="space-y-4">
							{getPassageBody(content).map((para, index) => (
								<p
									key={`${item.question.id}-completed-${index}`}
									className="whitespace-pre-wrap text-sm leading-relaxed"
								>
									{para}
								</p>
							))}
						</div>
					</div>

					<div className="flex-1 overflow-hidden">
						<ReadingAnswerDetail
							examId="read-1"
							questions={mockQuestions}
							answers={practiceAnswers}
							onHighlightParagraph={() => {}}
							summaryOverride={{
								score: latestScore,
								correct: estimatedCorrectCount,
								total: itemCount,
							}}
						/>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex h-full flex-col overflow-hidden">
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="space-y-1">
					<p className="text-sm font-semibold">{title}</p>
					<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
						<Badge variant="outline">Part {item.question.part}</Badge>
						{questionLevel && <Badge variant="secondary">{questionLevel}</Badge>}
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

			<div className="flex flex-1 overflow-hidden">
				<div className="w-1/2 overflow-y-auto border-r bg-muted/5 p-6">
					{"title" in content && content.title ? (
						<h3 className="mb-4 text-lg font-bold">{content.title}</h3>
					) : null}
					<div className="space-y-4">
						{getPassageBody(content).map((para, index) => (
							<p
								key={`${item.question.id}-${index}`}
								className="whitespace-pre-wrap text-sm leading-relaxed"
							>
								{para}
							</p>
						))}
					</div>
				</div>

				<div className="flex-1 overflow-y-auto p-6">
					<div className="space-y-6">
						{Array.from({ length: itemCount }, (_, index) => {
							const options = getItemOptions(content, index)
							const selected = selectedAnswers[String(index + 1)] ?? null

							return (
								<div
									key={`${item.question.id}-${index}`}
									id={`reading-item-${index}`}
									className="space-y-2"
								>
									<p className="text-sm font-medium">
										Câu {index + 1}. {getItemStem(content, index)}
									</p>
									<div className="grid gap-2 sm:grid-cols-2">
										{options.map((option, optionIndex) => {
											const letter = String.fromCharCode(65 + optionIndex)
											const isSelected = selected === letter

											return (
												<button
													key={`${item.question.id}-${index}-${letter}`}
													type="button"
													onClick={() => handleSelect(index, optionIndex)}
													disabled={phase !== "answering"}
													className={cn(
														"flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-all",
														isSelected
															? "border-primary bg-primary/5 ring-1 ring-primary/20"
															: "border-border hover:border-primary/40",
														phase !== "answering" && "cursor-not-allowed opacity-80",
													)}
												>
													<span
														className={cn(
															"flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
															isSelected
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
					</div>
				</div>
			</div>

			<div className="flex flex-wrap justify-center gap-1.5 border-t px-4 py-2.5">
				{Array.from({ length: itemCount }, (_, index) => {
					const isAnswered = selectedAnswers[String(index + 1)] != null
					return (
						<button
							key={index}
							type="button"
							onClick={() =>
								document
									.getElementById(`reading-item-${index}`)
									?.scrollIntoView({ behavior: "smooth", block: "center" })
							}
							className={cn(
								"flex size-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
								isAnswered
									? "border-primary bg-primary text-primary-foreground"
									: "border-border bg-background text-muted-foreground hover:bg-accent",
							)}
						>
							{index + 1}
						</button>
					)
				})}
			</div>

			<footer className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-t px-4 py-3">
				<div className="text-sm text-muted-foreground">
					{phase === "result" && latestScore !== null
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

				{phase === "result" && (
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

function ReadingPracticeLoader() {
	return (
		<div className="flex h-full flex-col overflow-hidden">
			<div className="border-b px-4 py-3">
				<Skeleton className="h-5 w-48" />
			</div>
			<div className="flex flex-1 overflow-hidden">
				<div className="w-1/2 space-y-3 border-r p-6">
					<Skeleton className="h-5 w-40" />
					{Array.from({ length: 6 }).map((_, index) => (
						<Skeleton key={index} className="h-4 w-full" />
					))}
				</div>
				<div className="flex-1 space-y-4 p-6">
					{Array.from({ length: 4 }).map((_, index) => (
						<div key={index} className="space-y-2">
							<Skeleton className="h-4 w-52" />
							<div className="grid gap-2 sm:grid-cols-2">
								{Array.from({ length: 4 }).map((__, optionIndex) => (
									<Skeleton key={optionIndex} className="h-12 w-full rounded-xl" />
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
