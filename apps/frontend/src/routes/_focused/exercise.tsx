import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { lazy, Suspense, useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { findExam, getAllQuestions } from "@/routes/_focused/-components/shared/exercise-shared"
import { skillColor, skillMeta } from "@/routes/_learner/exams/-components/skill-meta"
import type { ListeningExam } from "@/routes/_learner/practice/-components/mock-data"
import type { QuestionLevel, Skill } from "@/types/api"

const ListeningExerciseSection = lazy(() =>
	import("@/routes/_focused/-components/listening/ListeningExerciseSection").then((module) => ({
		default: module.ListeningExerciseSection,
	})),
)

const ReadingPracticeFlow = lazy(() =>
	import("@/routes/_focused/-components/reading/ReadingPracticeFlow").then((module) => ({
		default: module.ReadingPracticeFlow,
	})),
)

const SpeakingPracticeFlow = lazy(() =>
	import("@/routes/_focused/-components/speaking/SpeakingPracticeFlow").then((module) => ({
		default: module.SpeakingPracticeFlow,
	})),
)

const WritingPracticeFlow = lazy(() =>
	import("@/routes/_focused/-components/writing/WritingPracticeFlow").then((module) => ({
		default: module.WritingPracticeFlow,
	})),
)

export const Route = createFileRoute("/_focused/exercise")({
	component: ExercisePage,
	validateSearch: (search: Record<string, unknown>) => ({
		skill: (search.skill as string) || "",
		id: (search.id as string) || "",
		part: (search.part as string) || "",
		level: (search.level as string) || "",
		session: (search.session as string) || "",
	}),
})

function ExercisePage() {
	const { skill, id, part, level, session } = Route.useSearch()

	// Writing uses real API — adaptive session flow
	if (skill === "writing") {
		return (
			<Suspense fallback={<ExerciseShellSkeleton />}>
				<WritingExercisePage
					part={part ? Number(part) : undefined}
					sessionId={session || undefined}
				/>
			</Suspense>
		)
	}

	if (skill === "reading") {
		return (
			<Suspense fallback={<ExerciseShellSkeleton />}>
				<ReadingExercisePage
					part={part ? Number(part) : undefined}
					level={level ? (level as QuestionLevel) : undefined}
					sessionId={session || undefined}
				/>
			</Suspense>
		)
	}

	if (skill === "speaking") {
		return (
			<Suspense fallback={<ExerciseShellSkeleton />}>
				<SpeakingExercisePage
					part={part ? Number(part) : undefined}
					sessionId={session || undefined}
				/>
			</Suspense>
		)
	}

	return (
		<Suspense fallback={<ExerciseShellSkeleton />}>
			<MockExercisePage skill={skill} id={id} />
		</Suspense>
	)
}

function WritingExercisePage({ part, sessionId }: { part?: number; sessionId?: string }) {
	const meta = skillMeta.writing

	return (
		<div className="flex h-full flex-col">
			<header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
				<div className="flex items-center gap-2">
					<div
						className={cn("flex size-7 items-center justify-center rounded-lg", skillColor.writing)}
					>
						<HugeiconsIcon icon={meta.icon} className="size-4" />
					</div>
					<span className="text-sm font-semibold">Luyện viết</span>
				</div>
				<Button variant="ghost" size="sm" asChild>
					<Link to="/practice/writing">
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						Quay lại
					</Link>
				</Button>
			</header>

			<WritingPracticeFlow part={part} resumeSessionId={sessionId} />
		</div>
	)
}

function ExerciseShellSkeleton() {
	return (
		<div className="flex h-full flex-col">
			<header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
				<Skeleton className="h-5 w-32" />
				<Skeleton className="h-8 w-24" />
			</header>
			<div className="flex flex-1 overflow-hidden">
				<div className="w-1/2 space-y-4 border-r p-6">
					<Skeleton className="h-6 w-48" />
					{Array.from({ length: 8 }).map((_, index) => (
						<Skeleton key={index} className="h-4 w-full" />
					))}
				</div>
				<div className="flex-1 space-y-4 p-6">
					{Array.from({ length: 4 }).map((_, index) => (
						<div key={index} className="space-y-2">
							<Skeleton className="h-4 w-56" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

function ReadingExercisePage({
	part,
	level,
	sessionId,
}: {
	part?: number
	level?: QuestionLevel
	sessionId?: string
}) {
	const meta = skillMeta.reading

	return (
		<div className="flex h-full flex-col">
			<header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
				<div className="flex items-center gap-2">
					<div
						className={cn("flex size-7 items-center justify-center rounded-lg", skillColor.reading)}
					>
						<HugeiconsIcon icon={meta.icon} className="size-4" />
					</div>
					<span className="text-sm font-semibold">Luyện đọc</span>
				</div>
				<Button variant="ghost" size="sm" asChild>
					<Link to="/practice/reading">
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						Quay lại
					</Link>
				</Button>
			</header>

			<ReadingPracticeFlow part={part} level={level} resumeSessionId={sessionId} />
		</div>
	)
}

function SpeakingExercisePage({ part, sessionId }: { part?: number; sessionId?: string }) {
	const meta = skillMeta.speaking

	return (
		<div className="flex h-full flex-col">
			<header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
				<div className="flex items-center gap-2">
					<div
						className={cn(
							"flex size-7 items-center justify-center rounded-lg",
							skillColor.speaking,
						)}
					>
						<HugeiconsIcon icon={meta.icon} className="size-4" />
					</div>
					<span className="text-sm font-semibold">Luyện nói</span>
				</div>
				<Button variant="ghost" size="sm" asChild>
					<Link to="/practice/speaking">
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						Quay lại
					</Link>
				</Button>
			</header>

			<SpeakingPracticeFlow part={part} resumeSessionId={sessionId} />
		</div>
	)
}

function MockExercisePage({ skill, id }: { skill: string; id: string }) {
	const validSkill = skill === "listening"
	const exam = validSkill ? findExam(skill, id) : null

	const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
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

			{/* Content */}
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

			{submitted && (
				<footer className="flex h-14 shrink-0 items-center justify-center border-t px-4">
					<Button size="lg" variant="outline" className="rounded-xl px-8" onClick={handleReset}>
						Làm lại
					</Button>
				</footer>
			)}
		</div>
	)
}
