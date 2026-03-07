import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Cancel01Icon,
	CheckmarkCircle02Icon,
	Clock01Icon,
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
import {
	setMCQAnswer,
	useExamAnswers,
} from "@/routes/_learner/exams/-components/questions/useExamAnswers"
import { SKILL_ORDER, skillMeta } from "@/routes/_learner/exams/-components/skill-meta"
import { useTimer } from "@/routes/_learner/exams/-components/useTimer"
import type { ExamSessionDetail, Skill, SubmissionAnswer } from "@/types/api"
import { ListeningExamPanel } from "./-components/ListeningExamPanel"
import { ReadingExamPanel } from "./-components/ReadingExamPanel"
import { SpeakingExamPanel } from "./-components/SpeakingExamPanel"
import { WritingExamPanel } from "./-components/WritingExamPanel"

export const Route = createFileRoute("/_focused/practice/$sessionId")({
	component: PracticePage,
})

// --- Helpers ---

function formatTime(seconds: number): string {
	if (seconds <= 0) return "00:00"
	const m = Math.floor(seconds / 60)
	const s = seconds % 60
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

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

				<Button variant="ghost" size="sm" asChild>
					<Link to="/practice">
						<HugeiconsIcon icon={Cancel01Icon} className="size-4" />
						<span className="hidden sm:inline">Thoát</span>
					</Link>
				</Button>
			</header>

			{/* Body */}
			{currentSkill === "listening" ? (
				<ListeningExamPanel
					questions={currentQuestions}
					answers={answers}
					onSelectMCQ={handleMCQSelect}
				/>
			) : currentSkill === "reading" ? (
				<ReadingExamPanel
					questions={currentQuestions}
					answers={answers}
					onSelectMCQ={handleMCQSelect}
				/>
			) : currentSkill === "writing" ? (
				<WritingExamPanel
					questions={currentQuestions}
					answers={answers}
					onUpdateWriting={handleWritingUpdate}
				/>
			) : currentSkill === "speaking" ? (
				<SpeakingExamPanel questions={currentQuestions} />
			) : (
				<div className="flex flex-1 items-center justify-center">
					<p className="text-muted-foreground">Chọn một phần thi để bắt đầu.</p>
				</div>
			)}

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
						<DialogDescription>Sau khi nộp, bạn không thể chỉnh sửa câu trả lời.</DialogDescription>
					</DialogHeader>
					{totalQuestions > 0 && answerCount < totalQuestions && (
						<p className="text-sm text-warning">
							⚠ Bạn chưa trả lời hết ({totalQuestions - answerCount} câu còn trống)
						</p>
					)}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setConfirming(false)}
							disabled={submitExam.isPending}
						>
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
