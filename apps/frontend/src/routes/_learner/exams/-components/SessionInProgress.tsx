import { CheckmarkCircle02Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSubmitExam } from "@/hooks/use-exam-session"
import { cn } from "@/lib/utils"
import type { Exam, ExamSessionDetail, Skill, SubmissionAnswer } from "@/types/api"
import { ListeningQuestion } from "./questions/ListeningQuestion"
import { QuestionNavGrid } from "./questions/QuestionNavGrid"
import { ReadingQuestion } from "./questions/ReadingQuestion"
import { getObjectiveAnswer, setMCQAnswer, useExamAnswers } from "./questions/useExamAnswers"
import { WritingQuestion } from "./questions/WritingQuestion"
import { SKILL_ORDER, skillMeta } from "./skill-meta"
import { useTimer } from "./useTimer"

interface SessionInProgressProps {
	session: ExamSessionDetail
	sessionId: string
	exam: Exam | null
}

export function SessionInProgress({ session, sessionId, exam }: SessionInProgressProps) {
	const [confirming, setConfirming] = useState(false)
	const submitExam = useSubmitExam(sessionId)
	const durationMinutes = exam?.durationMinutes ?? 0
	const remaining = useTimer(session.startedAt, durationMinutes)
	const { answers, updateAnswer, flush, isSaving } = useExamAnswers(sessionId, session.answers)

	// Group questions by skill
	const questionsBySkill = useMemo(() => {
		const map = new Map<Skill, typeof session.questions>()
		for (const q of session.questions) {
			const list = map.get(q.skill) ?? []
			list.push(q)
			map.set(q.skill, list)
		}
		return map
	}, [session.questions])

	// Which skills actually have questions
	const activeSkills = useMemo(
		() => SKILL_ORDER.filter((s) => (questionsBySkill.get(s)?.length ?? 0) > 0),
		[questionsBySkill],
	)

	// Set of answered question IDs (for nav grid)
	const answeredIds = useMemo(() => new Set(answers.keys()), [answers])

	// Answer count for progress bar
	const answerCount = answers.size
	const totalQuestions = session.questions.length

	// MCQ answer handler
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

	// Writing answer handler
	const handleWritingUpdate = useCallback(
		(questionId: string, text: string) => {
			updateAnswer(questionId, { text } as SubmissionAnswer)
		},
		[updateAnswer],
	)

	// Jump to question (scroll into view)
	const handleJump = useCallback((questionId: string) => {
		document.getElementById(questionId)?.scrollIntoView({ behavior: "smooth", block: "center" })
	}, [])

	function handleSubmit() {
		flush()
		submitExam.mutate(undefined, {
			onSuccess: () => setConfirming(false),
		})
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="rounded-2xl bg-muted/30 p-6">
				<div className="flex items-center justify-between">
					<h1 className="text-xl font-bold">{exam?.title || `Đề thi ${exam?.level ?? ""}`}</h1>
					{isSaving && <span className="text-xs text-muted-foreground">Đang lưu...</span>}
				</div>
				<div className="mt-4 grid gap-3 sm:grid-cols-3">
					<InfoItem
						label="Bắt đầu lúc"
						value={new Date(session.startedAt).toLocaleString("vi-VN")}
					/>
					{durationMinutes > 0 && <InfoItem label="Thời gian" value={`${durationMinutes} phút`} />}
					<InfoItem label="Trạng thái" value="Đang làm bài" />
				</div>
			</div>

			{/* Timer */}
			{durationMinutes > 0 && (
				<div
					className={cn(
						"flex items-center gap-3 rounded-xl p-4",
						remaining <= 300 ? "bg-destructive/10 text-destructive" : "bg-muted/30",
					)}
				>
					<HugeiconsIcon icon={Clock01Icon} className="size-5" />
					<span className="font-mono text-lg font-semibold">{formatTime(remaining)}</span>
					<span className="text-sm text-muted-foreground">còn lại</span>
				</div>
			)}

			{/* Answer progress */}
			{totalQuestions > 0 && (
				<div className="rounded-xl bg-muted/30 p-4">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">Tiến độ trả lời</span>
						<span className="text-sm font-bold tabular-nums text-primary">
							{answerCount}/{totalQuestions}
						</span>
					</div>
					<div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-all"
							style={{ width: `${(answerCount / totalQuestions) * 100}%` }}
						/>
					</div>
				</div>
			)}

			{/* Skill tabs + questions */}
			{activeSkills.length > 0 && (
				<Tabs defaultValue={activeSkills[0]}>
					<TabsList variant="line">
						{activeSkills.map((skill) => {
							const meta = skillMeta[skill]
							const questions = questionsBySkill.get(skill) ?? []
							const answered = questions.filter((q) => answeredIds.has(q.id)).length
							return (
								<TabsTrigger key={skill} value={skill} className="gap-2">
									<HugeiconsIcon icon={meta.icon} className="size-4" />
									{meta.label}
									<span className="text-xs text-muted-foreground">
										{answered}/{questions.length}
									</span>
								</TabsTrigger>
							)
						})}
					</TabsList>

					{activeSkills.map((skill) => {
						const questions = questionsBySkill.get(skill) ?? []
						return (
							<TabsContent key={skill} value={skill} className="space-y-6">
								<QuestionNavGrid
									questions={questions}
									answeredIds={answeredIds}
									onJump={handleJump}
								/>
								<div className="space-y-10">
									{questions.map((q) => (
										<QuestionRenderer
											key={q.id}
											question={q}
											answers={answers}
											onSelectMCQ={handleMCQSelect}
											onUpdateWriting={handleWritingUpdate}
										/>
									))}
								</div>
							</TabsContent>
						)
					})}
				</Tabs>
			)}

			{/* Submit */}
			{confirming ? (
				<div className="space-y-4 rounded-xl border border-border p-5">
					<p className="font-medium">Bạn có chắc muốn nộp bài?</p>
					<p className="text-sm text-muted-foreground">
						Sau khi nộp, bạn không thể chỉnh sửa câu trả lời.
					</p>
					{totalQuestions > 0 && answerCount < totalQuestions && (
						<p className="text-sm text-warning">
							⚠ Bạn chưa trả lời hết ({totalQuestions - answerCount} câu còn trống)
						</p>
					)}
					<div className="flex gap-3">
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
					</div>
				</div>
			) : (
				<Button onClick={() => setConfirming(true)} className="gap-2">
					<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
					Nộp bài
				</Button>
			)}
		</div>
	)
}

// Dispatches to the right question component based on skill
function QuestionRenderer({
	question,
	answers,
	onSelectMCQ,
	onUpdateWriting,
}: {
	question: ExamSessionDetail["questions"][number]
	answers: Map<string, SubmissionAnswer>
	onSelectMCQ: (
		qId: string,
		current: Record<string, string>,
		itemIdx: number,
		optIdx: number,
	) => void
	onUpdateWriting: (qId: string, text: string) => void
}) {
	const currentObj = getObjectiveAnswer(answers, question.id)

	switch (question.skill) {
		case "listening":
			return (
				<ListeningQuestion
					question={question}
					currentAnswers={currentObj}
					onSelectAnswer={onSelectMCQ}
				/>
			)
		case "reading":
			return (
				<ReadingQuestion
					question={question}
					currentAnswers={currentObj}
					onSelectAnswer={onSelectMCQ}
				/>
			)
		case "writing": {
			const entry = answers.get(question.id)
			const text = entry && "text" in entry ? entry.text : ""
			return (
				<WritingQuestion question={question} currentText={text} onUpdateText={onUpdateWriting} />
			)
		}
		case "speaking":
			return (
				<div id={question.id} className="rounded-xl bg-muted/30 p-5">
					<p className="text-sm text-muted-foreground">
						Speaking — Part {question.part}: Chức năng ghi âm đang được phát triển.
					</p>
				</div>
			)
		default:
			return null
	}
}

function InfoItem({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="mt-0.5 font-medium">{value}</p>
		</div>
	)
}

function formatTime(seconds: number): string {
	if (seconds <= 0) return "00:00"
	const m = Math.floor(seconds / 60)
	const s = seconds % 60
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}
