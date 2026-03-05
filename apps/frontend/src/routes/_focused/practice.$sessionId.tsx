import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Cancel01Icon,
	CheckmarkCircle02Icon,
	Clock01Icon,
	Menu02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { useExamDetail, useExamSession, useSubmitExam } from "@/hooks/use-exam-session"
import { cn } from "@/lib/utils"
import { AudioPlayerSection } from "@/routes/_learner/exams/-components/questions/ListeningQuestion"
import {
	MatchingSection,
	PassageSection,
} from "@/routes/_learner/exams/-components/questions/ReadingQuestion"
import {
	getObjectiveAnswer,
	setMCQAnswer,
	useExamAnswers,
} from "@/routes/_learner/exams/-components/questions/useExamAnswers"
import { WritingPromptSection } from "@/routes/_learner/exams/-components/questions/WritingQuestion"
import { SKILL_ORDER, skillMeta } from "@/routes/_learner/exams/-components/skill-meta"
import { useTimer } from "@/routes/_learner/exams/-components/useTimer"
import type {
	ExamSessionDetail,
	ListeningContent,
	QuestionContent,
	ReadingContent,
	ReadingGapFillContent,
	ReadingMatchingContent,
	ReadingTNGContent,
	Skill,
	SubmissionAnswer,
	WritingContent,
} from "@/types/api"

export const Route = createFileRoute("/_focused/practice/$sessionId")({
	component: PracticePage,
})

// --- Type guards ---

function isListeningContent(c: QuestionContent): c is ListeningContent {
	return "audioUrl" in c && "items" in c
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

function isWritingContent(c: QuestionContent): c is WritingContent {
	return "prompt" in c && "taskType" in c
}

// --- Helpers ---

function formatTime(seconds: number): string {
	if (seconds <= 0) return "00:00"
	const m = Math.floor(seconds / 60)
	const s = seconds % 60
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

// --- Main Component ---

function PracticePage() {
	const { sessionId } = Route.useParams()
	const navigate = useNavigate()
	const { data: session, isLoading, error } = useExamSession(sessionId)
	const examQuery = useExamDetail(session?.examId ?? "")
	const exam = examQuery.data
	const submitExam = useSubmitExam(sessionId)

	const durationMinutes = exam?.durationMinutes ?? 0
	const remaining = useTimer(session?.startedAt ?? new Date().toISOString(), durationMinutes)

	const { answers, updateAnswer, flush, isSaving } = useExamAnswers(
		sessionId,
		session?.answers ?? [],
	)

	const [currentSkillIndex, setCurrentSkillIndex] = useState(0)
	const [confirming, setConfirming] = useState(false)
	const [navOpen, setNavOpen] = useState(false)
	const [mobileTab, setMobileTab] = useState<"stimulus" | "questions">("stimulus")

	// Group questions by skill
	const questionsBySkill = useMemo(() => {
		if (!session) return new Map<Skill, ExamSessionDetail["questions"]>()
		const map = new Map<Skill, ExamSessionDetail["questions"]>()
		for (const q of session.questions) {
			const list = map.get(q.skill) ?? []
			list.push(q)
			map.set(q.skill, list)
		}
		return map
	}, [session])

	const activeSkills = useMemo(
		() => SKILL_ORDER.filter((s) => (questionsBySkill.get(s)?.length ?? 0) > 0),
		[questionsBySkill],
	)

	const currentSkill = activeSkills[currentSkillIndex] ?? activeSkills[0]
	const currentQuestions = questionsBySkill.get(currentSkill) ?? []
	const isLastSkill = currentSkillIndex >= activeSkills.length - 1

	const answeredIds = useMemo(() => new Set(answers.keys()), [answers])
	const answerCount = answers.size
	const totalQuestions = session?.questions.length ?? 0

	// MCQ handler
	const handleMCQSelect = useCallback(
		(
			questionId: string,
			currentAnswers: Record<string, string>,
			itemIndex: number,
			optionIndex: number,
		) => {
			setMCQAnswer(updateAnswer, questionId, currentAnswers, itemIndex, optionIndex)
		},
		[updateAnswer],
	)

	// Writing handler
	const handleWritingUpdate = useCallback(
		(questionId: string, text: string) => {
			updateAnswer(questionId, { text } as SubmissionAnswer)
		},
		[updateAnswer],
	)

	// Navigation
	const prevSkill = useCallback(() => {
		setCurrentSkillIndex((i) => Math.max(0, i - 1))
	}, [])

	const nextSkill = useCallback(() => {
		setCurrentSkillIndex((i) => Math.min(activeSkills.length - 1, i + 1))
	}, [activeSkills.length])

	// Submit
	function handleSubmit() {
		flush()
		submitExam.mutate(undefined, {
			onSuccess: () => {
				setConfirming(false)
				navigate({ to: "/exams/sessions/$sessionId", params: { sessionId } })
			},
		})
	}

	// Jump to question (scroll into view)
	const handleJump = useCallback((questionId: string) => {
		document.getElementById(questionId)?.scrollIntoView({ behavior: "smooth", block: "center" })
		setNavOpen(false)
	}, [])

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-muted-foreground">Đang tải...</p>
			</div>
		)
	}

	if (error || !session) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-destructive">Lỗi: {error?.message ?? "Không tìm thấy phiên thi"}</p>
			</div>
		)
	}

	if (session.status !== "in_progress") {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<p className="text-muted-foreground">Phiên thi đã kết thúc.</p>
				<Button asChild variant="outline">
					<Link to="/exams/sessions/$sessionId" params={{ sessionId }}>
						Xem kết quả
					</Link>
				</Button>
			</div>
		)
	}

	const currentSkillLabel = currentSkill ? skillMeta[currentSkill].label : ""

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<header className="z-40 flex h-12 shrink-0 items-center justify-between border-b px-4">
				<div className="flex items-center gap-2">
					{durationMinutes > 0 && (
						<div
							className={cn(
								"flex items-center gap-1.5 rounded-full px-3 py-1",
								remaining <= 300 ? "bg-destructive/10 text-destructive" : "bg-muted",
							)}
						>
							<HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
							<span className="text-sm font-semibold tabular-nums">{formatTime(remaining)}</span>
						</div>
					)}
					{isSaving && <span className="text-xs text-muted-foreground">Đang lưu...</span>}
				</div>

				<span className="text-sm text-muted-foreground">
					{answerCount}/{totalQuestions} đã trả lời
				</span>

				<div className="flex items-center gap-1">
					<Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setNavOpen((v) => !v)}>
						<HugeiconsIcon icon={Menu02Icon} className="size-4" />
					</Button>
					<Button variant="ghost" size="sm" asChild>
						<Link to="/practice">
							<HugeiconsIcon icon={Cancel01Icon} className="size-4" />
							<span className="hidden sm:inline">Thoát</span>
						</Link>
					</Button>
				</div>
			</header>

			{/* Mobile question nav dropdown */}
			{navOpen && (
				<div className="z-30 border-b bg-background p-4 shadow-sm lg:hidden">
					<QuestionGrid
						questions={currentQuestions}
						answeredIds={answeredIds}
						onJump={handleJump}
					/>
				</div>
			)}

			{/* Body */}
			<div className="flex flex-1 overflow-hidden">
				{/* Desktop: stimulus (left) */}
				<div className="hidden w-2/5 overflow-y-auto border-r bg-muted/10 p-6 lg:block">
					<StimulusPanel skill={currentSkill} questions={currentQuestions} />
				</div>

				{/* Desktop: questions (center) */}
				<div className="hidden flex-1 overflow-y-auto bg-background p-6 lg:block">
					<QuestionsPanel
						skill={currentSkill}
						questions={currentQuestions}
						answers={answers}
						onSelectMCQ={handleMCQSelect}
						onUpdateWriting={handleWritingUpdate}
					/>
				</div>

				{/* Desktop: question nav (right sidebar) */}
				<div className="hidden w-[200px] shrink-0 overflow-y-auto border-l bg-muted/5 p-4 lg:block">
					<p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Danh sách câu hỏi
					</p>
					<QuestionGrid
						questions={currentQuestions}
						answeredIds={answeredIds}
						onJump={handleJump}
					/>
				</div>

				{/* Mobile tabbed layout */}
				<div className="flex flex-1 flex-col overflow-hidden lg:hidden">
					<div className="flex shrink-0 border-b">
						<button
							type="button"
							onClick={() => setMobileTab("stimulus")}
							className={cn(
								"flex-1 py-2.5 text-center text-sm font-medium transition-colors",
								mobileTab === "stimulus"
									? "border-b-2 border-primary text-primary"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							Đề bài
						</button>
						<button
							type="button"
							onClick={() => setMobileTab("questions")}
							className={cn(
								"flex-1 py-2.5 text-center text-sm font-medium transition-colors",
								mobileTab === "questions"
									? "border-b-2 border-primary text-primary"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							Trả lời
						</button>
					</div>
					<div className="flex-1 overflow-y-auto p-4">
						{mobileTab === "stimulus" ? (
							<StimulusPanel skill={currentSkill} questions={currentQuestions} />
						) : (
							<QuestionsPanel
								skill={currentSkill}
								questions={currentQuestions}
								answers={answers}
								onSelectMCQ={handleMCQSelect}
								onUpdateWriting={handleWritingUpdate}
							/>
						)}
					</div>
				</div>
			</div>

			{/* Footer */}
			<footer className="z-40 flex h-12 shrink-0 items-center justify-between border-t px-4">
				<Button variant="outline" size="sm" onClick={prevSkill} disabled={currentSkillIndex === 0}>
					<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
					<span className="hidden sm:inline">Phần trước</span>
				</Button>
				<span className="text-sm font-medium">
					{currentSkillLabel} ({currentSkillIndex + 1}/{activeSkills.length})
				</span>
				{isLastSkill ? (
					<Button size="sm" onClick={() => setConfirming(true)}>
						<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
						Nộp bài
					</Button>
				) : (
					<Button variant="outline" size="sm" onClick={nextSkill}>
						<span className="hidden sm:inline">Phần tiếp</span>
						<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
					</Button>
				)}
			</footer>

			{/* Confirm Submit Dialog */}
			<Dialog open={confirming} onOpenChange={setConfirming}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Bạn có chắc muốn nộp bài?</DialogTitle>
						<DialogDescription>
							Sau khi nộp, bạn không thể chỉnh sửa câu trả lời.
						</DialogDescription>
					</DialogHeader>
					{totalQuestions > 0 && answerCount < totalQuestions && (
						<p className="text-sm text-warning">
							⚠ Bạn chưa trả lời hết ({totalQuestions - answerCount} câu còn trống)
						</p>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setConfirming(false)} disabled={submitExam.isPending}>
							Hủy
						</Button>
						<Button onClick={handleSubmit} disabled={submitExam.isPending}>
							<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
							{submitExam.isPending ? "Đang nộp..." : "Nộp bài"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

// --- Stimulus Panel (left side) ---

function StimulusPanel({
	skill,
	questions,
}: {
	skill: Skill | undefined
	questions: ExamSessionDetail["questions"]
}) {
	if (!skill || questions.length === 0) return null

	return (
		<div className="space-y-6">
			{questions.map((q) => {
				const content = q.content

				if (skill === "listening" && isListeningContent(content)) {
					return (
						<div key={q.id}>
							<h3 className="mb-3 text-lg font-semibold">Listening — Part {q.part}</h3>
							<AudioPlayerSection audioUrl={content.audioUrl} transcript={content.transcript} />
						</div>
					)
				}

				if (skill === "reading") {
					const title = "title" in content ? (content as { title?: string }).title : undefined
					return (
						<div key={q.id}>
							<h3 className="mb-3 text-lg font-semibold">Reading — Part {q.part}</h3>
							{title && <p className="mb-2 font-bold">{title}</p>}
							{isReadingPassageContent(content) && <PassageSection passage={content.passage} />}
							{isReadingGapFillContent(content) && (
								<PassageSection passage={content.textWithGaps} />
							)}
							{isReadingMatchingContent(content) && <MatchingSection content={content} />}
						</div>
					)
				}

				if (skill === "writing" && isWritingContent(content)) {
					return (
						<div key={q.id}>
							<h3 className="mb-3 text-lg font-semibold">
								Writing — Part {q.part}
								<span className="ml-2 rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
									{content.taskType === "letter" ? "Letter" : "Essay"}
								</span>
							</h3>
							<WritingPromptSection content={content} />
						</div>
					)
				}

				if (skill === "speaking") {
					return (
						<div key={q.id} className="rounded-xl bg-muted/30 p-5">
							<h3 className="text-lg font-semibold">Speaking — Part {q.part}</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								Chức năng ghi âm đang được phát triển.
							</p>
						</div>
					)
				}

				return null
			})}
		</div>
	)
}

// --- Inline MCQ Item ---

function InlineMCQItem({
	index,
	stem,
	options,
	selectedOption,
	onSelect,
}: {
	index: number
	stem: string
	options: string[]
	selectedOption: string | null
	onSelect: (itemIndex: number, optionIndex: number) => void
}) {
	return (
		<div className="space-y-2">
			<p className="text-sm font-medium">
				Câu {index + 1}. {stem}
			</p>
			<div className="grid gap-2 sm:grid-cols-2">
				{options.map((opt, oi) => {
					const letter = LETTERS[oi] ?? String(oi + 1)
					const isSelected = selectedOption === letter
					return (
						<button
							key={`${index}-${oi}`}
							type="button"
							onClick={() => onSelect(index, oi)}
							className={cn(
								"flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-all",
								isSelected
									? "border-primary bg-primary/5 ring-1 ring-primary/20"
									: "border-border hover:border-primary/40",
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
							<span>{opt}</span>
						</button>
					)
				})}
			</div>
		</div>
	)
}

// --- Questions Panel (right side) ---

function QuestionsPanel({
	skill,
	questions,
	answers,
	onSelectMCQ,
	onUpdateWriting,
}: {
	skill: Skill | undefined
	questions: ExamSessionDetail["questions"]
	answers: Map<string, SubmissionAnswer>
	onSelectMCQ: (
		qId: string,
		current: Record<string, string>,
		itemIdx: number,
		optIdx: number,
	) => void
	onUpdateWriting: (qId: string, text: string) => void
}) {
	if (!skill || questions.length === 0) return null

	return (
		<div className="space-y-6">
			{questions.map((q) => {
				const content = q.content
				const currentObj = getObjectiveAnswer(answers, q.id)

				if ((skill === "listening" && isListeningContent(content)) || skill === "reading") {
					const items =
						"items" in content
							? (content as { items: { stem?: string; options: string[] }[] }).items
							: []
					const isMatching = isReadingMatchingContent(content)
					const matchingContent = isMatching ? content : null

					return (
						<div key={q.id} id={q.id} className="space-y-4">
							{items.map((item, i) => (
								<InlineMCQItem
									key={`${q.id}-${i}`}
									index={i}
									stem={
										"stem" in item && item.stem
											? item.stem
											: isMatching && matchingContent
												? `${matchingContent.paragraphs[i]?.label}. ${matchingContent.paragraphs[i]?.text}`
												: `Gap ${i + 1}`
									}
									options={"options" in item ? item.options : []}
									selectedOption={currentObj[String(i + 1)] ?? null}
									onSelect={(itemIndex, optionIndex) =>
										onSelectMCQ(q.id, currentObj, itemIndex, optionIndex)
									}
								/>
							))}

							{isMatching && matchingContent && (
								<div className="space-y-4">
									{matchingContent.paragraphs.map((para, i) => (
										<InlineMCQItem
											key={`${q.id}-m-${i}`}
											index={i}
											stem={`${para.label}. ${para.text}`}
											options={matchingContent.headings}
											selectedOption={currentObj[String(i + 1)] ?? null}
											onSelect={(itemIndex, optionIndex) =>
												onSelectMCQ(q.id, currentObj, itemIndex, optionIndex)
											}
										/>
									))}
								</div>
							)}
						</div>
					)
				}

				if (skill === "writing" && isWritingContent(content)) {
					const entry = answers.get(q.id)
					const text = entry && "text" in entry ? (entry as { text: string }).text : ""
					const wordCount = text.trim().split(/\s+/).filter(Boolean).length

					return (
						<div key={q.id} id={q.id} className="space-y-4">
							<textarea
								value={text}
								onChange={(e) => onUpdateWriting(q.id, e.target.value)}
								className="w-full min-h-[300px] rounded-xl border border-border p-4 text-sm focus:border-primary focus:outline-none resize-y"
								placeholder="Viết bài của bạn tại đây..."
							/>
							<p
								className={
									wordCount >= content.minWords
										? "text-sm text-green-600"
										: "text-sm text-muted-foreground"
								}
							>
								{wordCount}/{content.minWords} từ
							</p>
						</div>
					)
				}

				if (skill === "speaking") {
					return (
						<div key={q.id} id={q.id} className="rounded-xl bg-muted/30 p-5">
							<p className="text-sm text-muted-foreground">
								Speaking — Part {q.part}: Chức năng ghi âm đang được phát triển.
							</p>
						</div>
					)
				}

				return null
			})}
		</div>
	)
}

// --- Question Grid ---

function QuestionGrid({
	questions,
	answeredIds,
	onJump,
}: {
	questions: ExamSessionDetail["questions"]
	answeredIds: Set<string>
	onJump: (questionId: string) => void
}) {
	return (
		<>
			<div className="grid grid-cols-5 gap-1.5">
				{questions.map((q, i) => {
					const isAnswered = answeredIds.has(q.id)
					return (
						<button
							key={q.id}
							type="button"
							onClick={() => onJump(q.id)}
							className={cn(
								"flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
								isAnswered
									? "bg-primary text-primary-foreground"
									: "bg-background text-muted-foreground hover:bg-accent",
							)}
						>
							{i + 1}
						</button>
					)
				})}
			</div>
			<div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
				<span className="flex items-center gap-1.5">
					<span className="inline-block size-2.5 rounded-full bg-primary" />
					Đã trả lời
				</span>
				<span className="flex items-center gap-1.5">
					<span className="inline-block size-2.5 rounded-full border border-border bg-background" />
					Chưa trả lời
				</span>
			</div>
		</>
	)
}
