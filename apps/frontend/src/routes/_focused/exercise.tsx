import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { findExam, getAllQuestions } from "@/routes/_focused/-components/shared/exercise-shared"
import { ListeningExerciseSection } from "@/routes/_focused/-components/listening/ListeningExerciseSection"
import { ReadingExerciseSection } from "@/routes/_focused/-components/reading/ReadingExerciseSection"
import { SpeakingExerciseSection } from "@/routes/_focused/-components/speaking/SpeakingExerciseSection"
import { WritingExerciseSection } from "@/routes/_focused/-components/writing/WritingExerciseSection"
import { skillColor, skillMeta } from "@/routes/_learner/exams/-components/skill-meta"
import {
	type ListeningExam,
	type ReadingExam,
	type SpeakingExam,
	type WritingExam,
} from "@/routes/_learner/practice/-components/mock-data"
import type { Skill } from "@/types/api"

export const Route = createFileRoute("/_focused/exercise")({
	component: ExercisePage,
	validateSearch: (search: Record<string, unknown>) => ({
		skill: (search.skill as string) || "",
		id: (search.id as string) || "",
	}),
})

function ExercisePage() {
	const { skill, id } = Route.useSearch()

	const validSkill = ["listening", "reading", "writing", "speaking"].includes(skill)
	const exam = validSkill ? findExam(skill, id) : null

	const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
	const [writingTexts, setWritingTexts] = useState<Record<number, string>>({})
	const [submitted, setSubmitted] = useState(false)
	const [resetCounter, setResetCounter] = useState(0)

	const handleSelect = useCallback(
		(questionNumber: number, letter: string) => {
			if (submitted) return
			setSelectedAnswers((prev) => ({ ...prev, [questionNumber]: letter }))
		},
		[submitted],
	)

	const handleSubmit = useCallback(() => {
		setSubmitted(true)
	}, [])

	const handleReset = useCallback(() => {
		setSubmitted(false)
		setSelectedAnswers({})
		setWritingTexts({})
		setResetCounter((c) => c + 1)
		window.scrollTo({ top: 0, behavior: "smooth" })
	}, [])

	if (!validSkill || !exam) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<p className="text-muted-foreground">Không tìm thấy bài luyện tập.</p>
				<Button variant="outline" asChild>
					<Link to="/practice">Quay lại</Link>
				</Button>
			</div>
		)
	}

	const typedSkill = skill as Skill
	const meta = skillMeta[typedSkill]
	const questions = getAllQuestions(exam, skill)

	return (
		<div className="flex h-full flex-col">
			{/* Top bar */}
			<header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
				<div className="flex items-center gap-2">
					<div
						className={cn(
							"flex size-7 items-center justify-center rounded-lg",
							skillColor[typedSkill],
						)}
					>
						<HugeiconsIcon icon={meta.icon} className="size-4" />
					</div>
					<span className="text-sm font-semibold">{exam.title}</span>
				</div>
				<Button variant="ghost" size="sm" asChild>
					<Link to={`/practice/${skill}` as "/practice/reading"}>
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						Quay lại
					</Link>
				</Button>
			</header>

			{/* Content — each section manages its own skill-specific state */}
			{skill === "reading" ? (
				<ReadingExerciseSection
					key={resetCounter}
					exam={exam as ReadingExam}
					examId={id}
					questions={questions}
					selectedAnswers={selectedAnswers}
					submitted={submitted}
					onSelect={handleSelect}
				/>
			) : skill === "listening" ? (
				<ListeningExerciseSection
					key={resetCounter}
					exam={exam as ListeningExam}
					examId={id}
					questions={questions}
					selectedAnswers={selectedAnswers}
					submitted={submitted}
					onSelect={handleSelect}
					onSubmit={handleSubmit}
				/>
			) : skill === "writing" ? (
				<WritingExerciseSection
					key={resetCounter}
					exam={exam as WritingExam}
					examId={id}
					writingTexts={writingTexts}
					setWritingTexts={setWritingTexts}
					submitted={submitted}
				/>
			) : (
				<SpeakingExerciseSection
					key={resetCounter}
					exam={exam as SpeakingExam}
					submitted={submitted}
					parentExam={exam}
					parentSkill={skill}
					typedSkill={typedSkill}
					questions={questions}
					selectedAnswers={selectedAnswers}
				/>
			)}

			{/* Bottom bar (not for listening — it has its own) */}
			{skill !== "listening" && (
				<footer className="flex h-14 shrink-0 items-center justify-center border-t px-4">
					{!submitted ? (
						<Button size="lg" className="rounded-xl px-8" onClick={handleSubmit}>
							Nộp bài
						</Button>
					) : (
						<Button size="lg" variant="outline" className="rounded-xl px-8" onClick={handleReset}>
							Làm lại
						</Button>
					)}
				</footer>
			)}
			{/* Listening: show reset in bottom bar after submit */}
			{skill === "listening" && submitted && (
				<footer className="flex h-14 shrink-0 items-center justify-center border-t px-4">
					<Button size="lg" variant="outline" className="rounded-xl px-8" onClick={handleReset}>
						Làm lại
					</Button>
				</footer>
			)}
		</div>
	)
}
