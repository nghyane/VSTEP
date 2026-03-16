import { ArrowLeft01Icon, BulbIcon, Gps01Icon, TextIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useExplain, useParaphrase } from "@/hooks/use-ai"
import { useUploadAudio } from "@/hooks/use-uploads"
import { cn } from "@/lib/utils"
import { ReadingAnswerDetail } from "@/routes/_focused/-components/ReadingAnswerDetail"
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

// --- Helpers ---

function getExamText(exam: AnyExam, skill: string): string {
	switch (skill) {
		case "listening": {
			const e = exam as ListeningExam
			return e.sections.map((s) => s.questions.map((q) => q.questionText).join("\n")).join("\n")
		}
		case "reading": {
			const e = exam as ReadingExam
			return e.passages.map((p) => p.content).join("\n\n")
		}
		case "writing": {
			const e = exam as WritingExam
			return e.tasks.map((t) => t.prompt).join("\n\n")
		}
		case "speaking": {
			const e = exam as SpeakingExam
			return e.parts.map((p) => p.instructions).join("\n\n")
		}
		default:
			return ""
	}
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
	const [activeAiTool, setActiveAiTool] = useState<"paraphrase" | "explain" | null>(null)
	const [highlightParagraphIndex, setHighlightParagraphIndex] = useState<number | null>(null)
	const paraphrase = useParaphrase()
	const explain = useExplain()
	const uploadAudio = useUploadAudio()
	const [audioFile, setAudioFile] = useState<File | null>(null)
	const [audioUrl, setAudioUrl] = useState<string | null>(null)

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
		setActiveAiTool(null)
		setHighlightParagraphIndex(null)
		setAudioFile(null)
		setAudioUrl(null)
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
			{skill === "reading" ? (
				(() => {
					const e = exam as ReadingExam
					return (
						<div className="flex flex-1 overflow-hidden">
							{/* Left — passage with dimming */}
							<div className="w-1/2 overflow-y-auto border-r">
								<div className="p-6">
									{e.passages.map((passage) => (
										<div key={passage.passageNumber}>
											{passage.title && <h3 className="mb-4 text-lg font-bold">{passage.title}</h3>}
											<div className="space-y-4">
												{passage.content.split("\n\n").map((para, i) => (
													<p
														key={i}
														className={cn(
															"text-sm leading-relaxed transition-all duration-300",
															highlightParagraphIndex !== null &&
																highlightParagraphIndex !== i &&
																"opacity-15 blur-[0.5px]",
															highlightParagraphIndex === i &&
																"-ml-3 rounded-r-lg border-l-[3px] border-primary bg-primary/5 py-2 pl-3",
														)}
														style={{ whiteSpace: "pre-wrap" }}
													>
														{para}
													</p>
												))}
											</div>
										</div>
									))}
								</div>
							</div>
							{/* Right — questions or answer detail */}
							<div className="flex flex-1 flex-col overflow-hidden">
								{!submitted ? (
									<div className="flex-1 overflow-y-auto p-6">
										<div className="space-y-4">
											{e.passages
												.flatMap((p) => p.questions)
												.map((q) => (
													<div key={q.questionNumber} className="space-y-2">
														<p className="text-sm font-medium">
															Câu {q.questionNumber}.{q.questionText ? ` ${q.questionText}` : ""}
														</p>
														<div className="grid grid-cols-1 gap-2">
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
									</div>
								) : (
									<ReadingAnswerDetail
										examId={id}
										questions={questions}
										answers={selectedAnswers}
										onHighlightParagraph={setHighlightParagraphIndex}
									/>
								)}
							</div>
						</div>
					)
				})()
			) : (
				<div className="flex flex-1 overflow-hidden">
					{/* Left — exercise */}
					<div className="flex-1 overflow-y-auto">
						<div className="mx-auto max-w-3xl space-y-6 p-6">
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
													<div className="space-y-3">
														<input
															type="file"
															accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/webm,audio/ogg"
															className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/20"
															onChange={(e) => {
																const file = e.target.files?.[0]
																if (file) {
																	setAudioFile(file)
																	setAudioUrl(URL.createObjectURL(file))
																}
															}}
															disabled={submitted}
														/>
														{audioUrl && (
															<audio controls src={audioUrl} className="w-full rounded-lg">
																<track kind="captions" />
															</audio>
														)}
														{audioFile && !submitted && (
															<Button
																size="sm"
																variant="outline"
																className="w-full"
																disabled={uploadAudio.isPending}
																onClick={() => uploadAudio.mutate(audioFile)}
															>
																{uploadAudio.isPending ? "Đang tải lên..." : "Tải lên"}
															</Button>
														)}
														{uploadAudio.isSuccess && (
															<p className="text-xs text-green-600">Đã tải lên thành công</p>
														)}
													</div>
												</div>
											))}
										</div>
									)
								})()}
						</div>
					</div>

					{/* Right — AI tools sidebar (after submit) */}
					{submitted && (
						<aside className="hidden w-[320px] shrink-0 overflow-y-auto border-l lg:block">
							<div ref={resultsRef} className="space-y-4 p-5">
								{/* Results */}
								{skill === "listening" && (
									<McqResults questions={questions} answers={selectedAnswers} />
								)}
								{skill === "writing" && <WritingFeedback />}
								{skill === "speaking" && <SpeakingFeedback />}

								{/* AI tools */}
								<div className="space-y-3">
									<p className="text-sm font-semibold">Công cụ AI</p>

									{/* Paraphrasing */}
									<div
										className={cn(
											"rounded-xl p-4 transition-colors",
											activeAiTool === "paraphrase"
												? "bg-sky-500/10 ring-1 ring-sky-500/30"
												: "bg-muted/30",
										)}
									>
										<div className="flex items-start gap-3">
											<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
												<HugeiconsIcon icon={TextIcon} className="size-4" />
											</div>
											<div className="flex-1">
												<p className="text-sm font-semibold">Paraphrasing</p>
												<p className="mt-0.5 text-xs text-muted-foreground">
													Tô sáng các cụm từ có thể diễn đạt lại trong bài.
												</p>
											</div>
										</div>
										<Button
											size="sm"
											variant={activeAiTool === "paraphrase" ? "default" : "outline"}
											className="mt-3 w-full gap-1.5 rounded-lg text-xs"
											disabled={paraphrase.isPending}
											onClick={() => {
												if (activeAiTool === "paraphrase") {
													setActiveAiTool(null)
													return
												}
												setActiveAiTool("paraphrase")
												const text = getExamText(exam, skill)
												if (text) {
													paraphrase.mutate({ text, skill: typedSkill })
												}
											}}
										>
											<HugeiconsIcon icon={Gps01Icon} className="size-3.5" />
											{paraphrase.isPending
												? "Đang phân tích..."
												: activeAiTool === "paraphrase"
													? "Ẩn"
													: "Phân tích"}
										</Button>
									</div>

									{/* Giải thích chi tiết */}
									<div
										className={cn(
											"rounded-xl p-4 transition-colors",
											activeAiTool === "explain"
												? "bg-amber-500/10 ring-1 ring-amber-500/30"
												: "bg-muted/30",
										)}
									>
										<div className="flex items-start gap-3">
											<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
												<HugeiconsIcon icon={BulbIcon} className="size-4" />
											</div>
											<div className="flex-1">
												<p className="text-sm font-semibold">Giải thích chi tiết</p>
												<p className="mt-0.5 text-xs text-muted-foreground">
													Tô sáng ngữ pháp, từ vựng và chiến lược làm bài.
												</p>
											</div>
										</div>
										<Button
											size="sm"
											variant={activeAiTool === "explain" ? "default" : "outline"}
											className="mt-3 w-full gap-1.5 rounded-lg text-xs"
											disabled={explain.isPending}
											onClick={() => {
												if (activeAiTool === "explain") {
													setActiveAiTool(null)
													return
												}
												setActiveAiTool("explain")
												const text = getExamText(exam, skill)
												if (text) {
													explain.mutate({
														text,
														skill: typedSkill,
														answers: Object.fromEntries(
															Object.entries(selectedAnswers).map(([k, v]) => [String(k), v]),
														),
														correctAnswers: Object.fromEntries(
															questions.map((q) => [String(q.questionNumber), q.correctAnswer]),
														),
													})
												}
											}}
										>
											<HugeiconsIcon icon={Gps01Icon} className="size-3.5" />
											{explain.isPending
												? "Đang phân tích..."
												: activeAiTool === "explain"
													? "Ẩn"
													: "Phân tích"}
										</Button>
									</div>
								</div>

								{/* AI Results */}
								{paraphrase.data && activeAiTool === "paraphrase" && (
									<div className="space-y-2 rounded-xl bg-sky-50/50 p-4 dark:bg-sky-950/10">
										<p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
											Gợi ý paraphrase
										</p>
										{paraphrase.data.highlights.map((h, i) => (
											<div key={i} className="space-y-0.5 text-sm">
												<p className="font-medium">{h.phrase}</p>
												<p className="text-xs text-muted-foreground">{h.note}</p>
											</div>
										))}
									</div>
								)}

								{explain.data && activeAiTool === "explain" && (
									<div className="space-y-2 rounded-xl bg-amber-50/50 p-4 dark:bg-amber-950/10">
										<p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
											Giải thích chi tiết
										</p>
										{explain.data.highlights.map((h, i) => (
											<div key={i} className="space-y-0.5 text-sm">
												<p className="font-medium">
													<span className="mr-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px]">
														{h.category}
													</span>
													{h.phrase}
												</p>
												<p className="text-xs text-muted-foreground">{h.note}</p>
											</div>
										))}
										{explain.data.questionExplanations?.map((qe) => (
											<div key={qe.questionNumber} className="space-y-0.5 border-t pt-2 text-sm">
												<p className="font-medium">
													Câu {qe.questionNumber}: {qe.correctAnswer}
												</p>
												<p className="text-xs text-muted-foreground">{qe.explanation}</p>
											</div>
										))}
									</div>
								)}

								{(paraphrase.isPending || explain.isPending) && (
									<div className="flex items-center justify-center py-4">
										<p className="text-sm text-muted-foreground">Đang phân tích...</p>
									</div>
								)}
							</div>
						</aside>
					)}
				</div>
			)}

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
