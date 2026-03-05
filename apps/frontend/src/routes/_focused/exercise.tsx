import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { skillColor, skillMeta } from "@/routes/_learner/exams/-components/skill-meta"
import {
	type ExamQuestion,
	LISTENING_EXAMS,
	type ListeningExam,
	READING_EXAMS,
	type ReadingExam,
	SPEAKING_EXAMS,
	type SpeakingExam,
	WRITING_EXAMS,
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

type AnyExam = ListeningExam | ReadingExam | WritingExam | SpeakingExam

function findExam(skill: string, id: string): AnyExam | null {
	switch (skill) {
		case "listening":
			return LISTENING_EXAMS.find((e) => e.id === id) ?? null
		case "reading":
			return READING_EXAMS.find((e) => e.id === id) ?? null
		case "writing":
			return WRITING_EXAMS.find((e) => e.id === id) ?? null
		case "speaking":
			return SPEAKING_EXAMS.find((e) => e.id === id) ?? null
		default:
			return null
	}
}

function getAllQuestions(exam: AnyExam, skill: string): ExamQuestion[] {
	switch (skill) {
		case "listening":
			return (exam as ListeningExam).sections.flatMap((s) => s.questions)
		case "reading":
			return (exam as ReadingExam).passages.flatMap((p) => p.questions)
		default:
			return []
	}
}

// --- MCQ Options ---

function McqOption({
	letter,
	text,
	isSelected,
	isCorrect,
	isWrong,
	submitted,
	onSelect,
}: {
	letter: string
	text: string
	isSelected: boolean
	isCorrect: boolean
	isWrong: boolean
	submitted: boolean
	onSelect: () => void
}) {
	let cls = "border bg-background"
	if (submitted) {
		if (isCorrect)
			cls = "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
		else if (isWrong)
			cls = "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
	} else if (isSelected) {
		cls = "border-primary bg-primary/5 ring-1 ring-primary/20"
	}

	return (
		<button
			type="button"
			className={cn(
				"flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors",
				cls,
				!submitted && "cursor-pointer hover:border-primary/40",
			)}
			onClick={onSelect}
			disabled={submitted}
		>
			<span
				className={cn(
					"flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
					submitted && isCorrect
						? "bg-green-500 text-white"
						: submitted && isWrong
							? "bg-red-500 text-white"
							: isSelected
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground",
				)}
			>
				{letter}
			</span>
			<span>{text}</span>
		</button>
	)
}

// --- Results ---

function McqResults({
	questions,
	answers,
}: {
	questions: ExamQuestion[]
	answers: Record<number, string>
}) {
	const correct = questions.filter((q) => answers[q.questionNumber] === q.correctAnswer).length

	return (
		<div className="rounded-2xl border border-green-200 bg-green-50/50 p-5 dark:border-green-800 dark:bg-green-950/20">
			<h3 className="text-lg font-bold">Kết quả</h3>
			<p className="mt-1 text-sm text-muted-foreground">
				Bạn trả lời đúng{" "}
				<span className="font-semibold text-green-600">
					{correct}/{questions.length}
				</span>{" "}
				câu
			</p>
			<div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-green-500 transition-all"
					style={{
						width: `${questions.length > 0 ? (correct / questions.length) * 100 : 0}%`,
					}}
				/>
			</div>
		</div>
	)
}

function WritingFeedback() {
	return (
		<div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-800 dark:bg-blue-950/20">
			<h3 className="text-lg font-bold">Nhận xét từ AI</h3>
			<p className="text-2xl font-bold text-blue-600">7.5/10</p>
			<ul className="space-y-2 text-sm">
				<li>
					<span className="font-medium">Task Fulfillment:</span> Bài viết đáp ứng đầy đủ yêu cầu đề
					bài. Các ý chính được trình bày rõ ràng.
				</li>
				<li>
					<span className="font-medium">Organization:</span> Cấu trúc bài viết rõ ràng, có mở bài,
					thân bài và kết bài hợp lý.
				</li>
				<li>
					<span className="font-medium">Vocabulary:</span> Sử dụng từ vựng phù hợp với ngữ cảnh, có
					một số từ nâng cao.
				</li>
				<li>
					<span className="font-medium">Grammar:</span> Ngữ pháp chính xác, ít lỗi nhỏ. Cần chú ý
					thì và sự hòa hợp chủ-vị.
				</li>
			</ul>
		</div>
	)
}

function SpeakingFeedback() {
	return (
		<div className="space-y-3 rounded-2xl border border-purple-200 bg-purple-50/50 p-5 dark:border-purple-800 dark:bg-purple-950/20">
			<h3 className="text-lg font-bold">Gợi ý trả lời</h3>
			<ul className="space-y-2 text-sm">
				<li>Hãy mở đầu bằng câu giới thiệu chung về chủ đề.</li>
				<li>Đưa ra ví dụ cụ thể từ trải nghiệm cá nhân của bạn.</li>
				<li>
					Sử dụng liên từ để nối các ý:{" "}
					<span className="font-medium">However, Moreover, In addition, Furthermore</span>
				</li>
				<li>Kết thúc bằng câu tổng kết hoặc nêu quan điểm cá nhân.</li>
				<li>Chú ý phát âm rõ ràng, tốc độ vừa phải, và duy trì giao tiếp mắt.</li>
			</ul>
		</div>
	)
}

// --- Main ---

function ExercisePage() {
	const { skill, id } = Route.useSearch()
	const resultsRef = useRef<HTMLDivElement>(null)

	const validSkill = ["listening", "reading", "writing", "speaking"].includes(skill)
	const exam = validSkill ? findExam(skill, id) : null

	const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
	const [writingTexts, setWritingTexts] = useState<Record<number, string>>({})
	const [submitted, setSubmitted] = useState(false)

	const handleSelect = useCallback(
		(questionNumber: number, letter: string) => {
			if (submitted) return
			setSelectedAnswers((prev) => ({ ...prev, [questionNumber]: letter }))
		},
		[submitted],
	)

	const handleSubmit = useCallback(() => {
		setSubmitted(true)
		setTimeout(() => {
			resultsRef.current?.scrollIntoView({ behavior: "smooth" })
		}, 100)
	}, [])

	const handleReset = useCallback(() => {
		setSubmitted(false)
		setSelectedAnswers({})
		setWritingTexts({})
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
					<Link to={`/practice/${skill}`}>
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						Quay lại
					</Link>
				</Button>
			</header>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				<div className="mx-auto max-w-3xl space-y-6 p-6">
					{/* Results (after submit) */}
					{submitted && (
						<div ref={resultsRef}>
							{(skill === "listening" || skill === "reading") && (
								<McqResults questions={questions} answers={selectedAnswers} />
							)}
							{skill === "writing" && <WritingFeedback />}
							{skill === "speaking" && <SpeakingFeedback />}
						</div>
					)}

					{/* Listening */}
					{skill === "listening" &&
						(() => {
							const e = exam as ListeningExam
							return (
								<div className="space-y-6">
									<audio controls src={e.audioUrl} className="w-full rounded-lg">
										<track kind="captions" />
									</audio>
									{e.sections.map((section) => (
										<div key={section.partNumber} className="space-y-4">
											{section.partTitle && (
												<h3 className="text-sm font-semibold">{section.partTitle}</h3>
											)}
											{section.instructions && (
												<p className="text-sm text-muted-foreground">{section.instructions}</p>
											)}
											{section.questions.map((q) => (
												<div key={q.questionNumber} className="space-y-2">
													<p className="text-sm font-medium">
														Câu {q.questionNumber}.{q.questionText ? ` ${q.questionText}` : ""}
													</p>
													<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
																onSelect={() => handleSelect(q.questionNumber, letter)}
															/>
														))}
													</div>
												</div>
											))}
										</div>
									))}
								</div>
							)
						})()}

					{/* Reading */}
					{skill === "reading" &&
						(() => {
							const e = exam as ReadingExam
							return (
								<div className="space-y-6">
									{e.passages.map((passage) => (
										<div key={passage.passageNumber} className="space-y-4">
											{passage.title && <h3 className="text-sm font-semibold">{passage.title}</h3>}
											<div
												className="rounded-xl bg-muted/10 p-4 text-sm leading-relaxed"
												style={{ whiteSpace: "pre-wrap" }}
											>
												{passage.content}
											</div>
											{passage.questions.map((q) => (
												<div key={q.questionNumber} className="space-y-2">
													<p className="text-sm font-medium">
														Câu {q.questionNumber}.{q.questionText ? ` ${q.questionText}` : ""}
													</p>
													<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
																onSelect={() => handleSelect(q.questionNumber, letter)}
															/>
														))}
													</div>
												</div>
											))}
										</div>
									))}
								</div>
							)
						})()}

					{/* Writing */}
					{skill === "writing" &&
						(() => {
							const e = exam as WritingExam
							return (
								<div className="space-y-6">
									{e.tasks.map((task) => {
										const text = writingTexts[task.taskNumber] ?? ""
										const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
										return (
											<div key={task.taskNumber} className="space-y-4">
												{task.title && <h3 className="text-sm font-semibold">{task.title}</h3>}
												<div
													className="rounded-xl bg-muted/10 p-4 text-sm leading-relaxed"
													style={{ whiteSpace: "pre-wrap" }}
												>
													{task.prompt}
												</div>
												{task.instructions && (
													<p className="text-sm text-muted-foreground">{task.instructions}</p>
												)}
												<textarea
													className="min-h-[250px] w-full rounded-xl border bg-background p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
													placeholder="Nhập bài viết của bạn..."
													value={text}
													onChange={(e) =>
														setWritingTexts((prev) => ({
															...prev,
															[task.taskNumber]: e.target.value,
														}))
													}
													disabled={submitted}
												/>
												<p className="text-sm text-muted-foreground">
													{wordCount}/{task.wordLimit} từ
													{wordCount < task.wordLimit && (
														<span className="ml-1 text-orange-500">
															(cần tối thiểu {task.wordLimit} từ)
														</span>
													)}
												</p>
											</div>
										)
									})}
								</div>
							)
						})()}

					{/* Speaking */}
					{skill === "speaking" &&
						(() => {
							const e = exam as SpeakingExam
							return (
								<div className="space-y-6">
									{e.parts.map((part) => (
										<div key={part.partNumber} className="space-y-3">
											{part.title && <h3 className="text-sm font-semibold">{part.title}</h3>}
											<div
												className="rounded-xl bg-muted/10 p-4 text-sm leading-relaxed"
												style={{ whiteSpace: "pre-wrap" }}
											>
												{part.instructions}
											</div>
											<p className="text-sm text-muted-foreground">
												Thời gian nói: {part.speakingTime} phút
											</p>
											<div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
												Chức năng ghi âm đang được phát triển
											</div>
										</div>
									))}
								</div>
							)
						})()}
				</div>
			</div>

			{/* Bottom bar */}
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
		</div>
	)
}
