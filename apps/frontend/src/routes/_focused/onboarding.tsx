import { useMutation } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { PlacementStarted, VstepBand } from "@/types/api"

export const Route = createFileRoute("/_focused/onboarding")({
	component: OnboardingPage,
})

const LEVELS = [
	{
		band: "A2",
		title: "Mới bắt đầu (A2)",
		desc: "Bạn biết tiếng Anh cơ bản, giao tiếp đơn giản trong cuộc sống hàng ngày",
	},
	{
		band: "B1",
		title: "Trung cấp (B1)",
		desc: "Hiểu ý chính khi nghe/đọc, viết được đoạn văn ngắn, nói được về chủ đề quen thuộc",
	},
	{
		band: "B2",
		title: "Khá (B2)",
		desc: "Đọc hiểu báo chí, viết bài luận có cấu trúc, thảo luận tự tin về nhiều chủ đề",
	},
	{
		band: "C1",
		title: "Nâng cao (C1)",
		desc: "Sử dụng tiếng Anh thành thạo, đọc tài liệu học thuật, viết essay phức tạp",
	},
] as const

const TARGET_BANDS: VstepBand[] = ["B1", "B2", "C1"]

const DEADLINES = [
	{ label: "1 tháng", months: 1 },
	{ label: "3 tháng", months: 3 },
	{ label: "6 tháng", months: 6 },
	{ label: "1 năm", months: 12 },
	{ label: "Không giới hạn", months: undefined },
] as const

const DAILY_TIMES = [
	{ label: "15 phút", minutes: 15 },
	{ label: "30 phút", minutes: 30 },
	{ label: "1 giờ", minutes: 60 },
	{ label: "2 giờ", minutes: 120 },
	{ label: "Tuỳ tôi", minutes: undefined },
] as const

function OnboardingPage() {
	const navigate = useNavigate()
	const [step, setStep] = useState<"welcome" | "self-assess" | "quiz" | "goal" | "skip">("welcome")
	const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
	const [targetBand, setTargetBand] = useState<VstepBand>("B2")
	const [deadlineMonths, setDeadlineMonths] = useState<number | undefined>(3)
	const [dailyMinutes, setDailyMinutes] = useState<number | undefined>(30)

	// Quiz state
	const [quizIndex, setQuizIndex] = useState(0)
	const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(
		Array(QUIZ_QUESTIONS.length).fill(null),
	)
	const [quizDone, setQuizDone] = useState(false)

	const selfAssess = useMutation({
		mutationFn: (body: {
			listening: string
			reading: string
			writing: string
			speaking: string
			targetBand: VstepBand
			deadline?: string
			dailyStudyTimeMinutes?: number
		}) => api.post("/api/onboarding/self-assess", body),
		onSuccess: () => {
			localStorage.setItem("vstep_onboarding_done", "1")
			navigate({ to: "/progress" })
		},
	})

	const startPlacement = useMutation({
		mutationFn: () => api.post<PlacementStarted>("/api/onboarding/placement"),
		onSuccess: (data) =>
			navigate({ to: "/practice/$sessionId", params: { sessionId: data.sessionId } }),
	})

	const skipOnboarding = useMutation({
		mutationFn: (body: {
			targetBand: VstepBand
			englishYears?: number
			previousTest?: "ielts" | "toeic" | "vstep" | "other" | "none"
			previousScore?: string
			deadline?: string
			dailyStudyTimeMinutes?: number
		}) => api.post("/api/onboarding/skip", body),
		onSuccess: () => {
			localStorage.setItem("vstep_onboarding_done", "1")
			navigate({ to: "/progress" })
		},
	})

	function handleSelectLevel(band: string) {
		setSelectedLevel(band)
		setStep("goal")
	}

	function handleSubmit() {
		const deadline =
			deadlineMonths != null
				? new Date(Date.now() + deadlineMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
				: undefined

		selfAssess.mutate({
			listening: selectedLevel!,
			reading: selectedLevel!,
			writing: selectedLevel!,
			speaking: selectedLevel!,
			targetBand,
			deadline,
			dailyStudyTimeMinutes: dailyMinutes,
		})
	}

	const toggleBtnClass = (active: boolean) =>
		cn(
			"rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors",
			active
				? "border-primary bg-primary/10 text-primary"
				: "border-border hover:border-primary/50",
		)

	const handleQuizAnswer = useCallback(
		(optionIndex: number) => {
			const next = [...quizAnswers]
			next[quizIndex] = optionIndex
			setQuizAnswers(next)

			if (quizIndex < QUIZ_QUESTIONS.length - 1) {
				setTimeout(() => setQuizIndex((i) => i + 1), 300)
			} else {
				setTimeout(() => {
					const level = scoreQuiz(next as number[])
					setSelectedLevel(level)
					setQuizDone(true)
				}, 300)
			}
		},
		[quizAnswers, quizIndex],
	)

	const quizLevel = quizDone ? selectedLevel : null

	return (
		<div className="mx-auto max-w-2xl px-4 py-12">
			{/* Step 0: Welcome — choose path */}
			{step === "welcome" && (
				<div className="space-y-8">
					<div className="text-center">
						<h1 className="text-3xl font-bold">Chào mừng bạn đến VSTEP</h1>
						<p className="mt-3 text-muted-foreground">
							Hãy cho chúng tôi biết trình độ của bạn để cá nhân hoá lộ trình học
						</p>
					</div>

					<div className="space-y-3">
						<button
							type="button"
							onClick={() => setStep("self-assess")}
							className="flex w-full items-center justify-between rounded-2xl border-2 border-border bg-background px-6 py-5 text-left transition-all hover:border-primary hover:shadow-sm"
						>
							<div>
								<p className="text-lg font-bold">Tự xác định trình độ</p>
								<p className="mt-1 text-sm text-muted-foreground">
									Chọn mức A2 – C1 mà bạn cảm thấy phù hợp nhất
								</p>
							</div>
							<span className="text-muted-foreground">→</span>
						</button>

						<button
							type="button"
							onClick={() => setStep("quiz")}
							className="flex w-full items-center justify-between rounded-2xl border-2 border-border bg-background px-6 py-5 text-left transition-all hover:border-primary hover:shadow-sm"
						>
							<div>
								<p className="text-lg font-bold">Làm bài kiểm tra</p>
								<p className="mt-1 text-sm text-muted-foreground">
									10 câu trắc nghiệm · khoảng 3 phút
								</p>
							</div>
							<span className="text-muted-foreground">→</span>
						</button>

						<button
							type="button"
							onClick={() => startPlacement.mutate()}
							disabled={startPlacement.isPending}
							className="flex w-full items-center justify-between rounded-2xl border-2 border-border bg-background px-6 py-5 text-left transition-all hover:border-primary hover:shadow-sm"
						>
							<div>
								<p className="text-lg font-bold">Làm bài test đánh giá thật</p>
								<p className="mt-1 text-sm text-muted-foreground">
									Bài test Listening & Reading · khoảng 60 phút
								</p>
							</div>
							<span className="text-muted-foreground">→</span>
						</button>
					</div>

					<div className="text-center">
						<button
							type="button"
							onClick={() => setStep("skip")}
							className="mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							Bỏ qua, tôi muốn vào học luôn →
						</button>
					</div>
				</div>
			)}

			{/* Step 1a: Self-assess */}
			{step === "self-assess" && (
				<div className="space-y-6">
					<div>
						<h1 className="text-2xl font-bold">Trình độ hiện tại của bạn</h1>
						<p className="mt-2 text-sm text-muted-foreground">
							Chọn mức phù hợp nhất với khả năng hiện tại
						</p>
					</div>

					<div className="space-y-3">
						{LEVELS.map((level) => (
							<button
								key={level.band}
								type="button"
								onClick={() => handleSelectLevel(level.band)}
								className="flex w-full items-start gap-4 rounded-2xl border border-border bg-background p-5 text-left transition-colors hover:border-primary"
							>
								<div>
									<p className="font-bold">{level.title}</p>
									<p className="mt-1 text-sm text-muted-foreground">{level.desc}</p>
								</div>
							</button>
						))}
					</div>

					<Button variant="ghost" onClick={() => setStep("welcome")} className="rounded-xl">
						← Quay lại
					</Button>
				</div>
			)}

			{/* Step 1b: Quiz */}
			{step === "quiz" && (
				<div className="space-y-6">
					{!quizDone ? (
						<QuizView
							question={QUIZ_QUESTIONS[quizIndex]}
							index={quizIndex}
							total={QUIZ_QUESTIONS.length}
							selected={quizAnswers[quizIndex]}
							onSelect={handleQuizAnswer}
							onBack={() => {
								setQuizIndex(0)
								setQuizAnswers(Array(QUIZ_QUESTIONS.length).fill(null))
								setQuizDone(false)
								setStep("welcome")
							}}
						/>
					) : (
						<div className="space-y-6 text-center">
							<div>
								<h1 className="text-2xl font-bold">Kết quả đánh giá</h1>
								<p className="mt-2 text-muted-foreground">
									Dựa trên câu trả lời, trình độ ước tính của bạn là
								</p>
							</div>
							<div className="mx-auto w-fit rounded-2xl border-2 border-primary bg-primary/10 px-12 py-6">
								<p className="text-4xl font-bold text-primary">{quizLevel}</p>
								<p className="mt-1 text-sm text-muted-foreground">
									{LEVELS.find((l) => l.band === quizLevel)?.title}
								</p>
							</div>
							<div className="flex justify-center gap-3">
								<Button
									variant="outline"
									className="rounded-xl"
									onClick={() => {
										setQuizIndex(0)
										setQuizAnswers(Array(QUIZ_QUESTIONS.length).fill(null))
										setQuizDone(false)
									}}
								>
									Làm lại
								</Button>
								<Button className="rounded-xl" onClick={() => setStep("goal")}>
									Tiếp tục thiết lập mục tiêu
								</Button>
							</div>
						</div>
					)}
				</div>
			)}
			{/* Step 2: Goal */}
			{step === "goal" && (
				<div className="space-y-6">
					<div>
						<h1 className="text-2xl font-bold">Mục tiêu của bạn</h1>
						<p className="mt-2 text-sm text-muted-foreground">
							Thiết lập mục tiêu để lộ trình học phù hợp hơn
						</p>
					</div>

					<div className="space-y-5 rounded-2xl border border-border bg-background p-6">
						<div className="space-y-2.5">
							<p className="text-sm font-medium">Band mục tiêu</p>
							<div className="flex gap-2">
								{TARGET_BANDS.map((b) => (
									<button
										key={b}
										type="button"
										onClick={() => setTargetBand(b)}
										className={toggleBtnClass(targetBand === b)}
									>
										{b}
									</button>
								))}
							</div>
						</div>

						<div className="space-y-2.5">
							<p className="text-sm font-medium">Thời hạn</p>
							<div className="flex flex-wrap gap-2">
								{DEADLINES.map((d) => (
									<button
										key={d.label}
										type="button"
										onClick={() => setDeadlineMonths(d.months)}
										className={toggleBtnClass(deadlineMonths === d.months)}
									>
										{d.label}
									</button>
								))}
							</div>
						</div>

						<div className="space-y-2.5">
							<p className="text-sm font-medium">Thời gian học mỗi ngày</p>
							<div className="flex flex-wrap gap-2">
								{DAILY_TIMES.map((t) => (
									<button
										key={t.label}
										type="button"
										onClick={() => setDailyMinutes(t.minutes)}
										className={toggleBtnClass(dailyMinutes === t.minutes)}
									>
										{t.label}
									</button>
								))}
							</div>
						</div>
					</div>

					<div className="flex gap-3">
						<Button
							variant="outline"
							onClick={() => setStep(selectedLevel && quizDone ? "quiz" : "self-assess")}
							className="rounded-xl"
						>
							← Quay lại
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={selfAssess.isPending}
							className="flex-1 rounded-xl"
						>
							{selfAssess.isPending ? "Đang xử lý..." : "Bắt đầu luyện tập"}
						</Button>
					</div>
				</div>
			)}

			{/* Step: Skip — minimal survey */}
			{step === "skip" && (
				<SkipForm
					onSubmit={(body) => skipOnboarding.mutate(body)}
					isPending={skipOnboarding.isPending}
					onBack={() => setStep("welcome")}
				/>
			)}
		</div>
	)
}

// ---------------------------------------------------------------------------
// Skip form component
// ---------------------------------------------------------------------------

const PREVIOUS_TESTS = [
	{ value: "none", label: "Chưa từng" },
	{ value: "vstep", label: "VSTEP" },
	{ value: "ielts", label: "IELTS" },
	{ value: "toeic", label: "TOEIC" },
	{ value: "other", label: "Khác" },
] as const

function SkipForm({
	onSubmit,
	isPending,
	onBack,
}: {
	onSubmit: (body: {
		targetBand: VstepBand
		englishYears?: number
		previousTest?: "ielts" | "toeic" | "vstep" | "other" | "none"
		previousScore?: string
		deadline?: string
		dailyStudyTimeMinutes?: number
	}) => void
	isPending: boolean
	onBack: () => void
}) {
	const [targetBand, setTargetBand] = useState<VstepBand>("B2")
	const [englishYears, setEnglishYears] = useState("")
	const [previousTest, setPreviousTest] = useState<"ielts" | "toeic" | "vstep" | "other" | "none">(
		"none",
	)
	const [previousScore, setPreviousScore] = useState("")

	const toggleBtnClass = (active: boolean) =>
		cn(
			"rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors",
			active
				? "border-primary bg-primary/10 text-primary"
				: "border-border hover:border-primary/50",
		)

	function handleSubmit() {
		onSubmit({
			targetBand,
			englishYears: englishYears ? Number(englishYears) : undefined,
			previousTest,
			previousScore: previousTest !== "none" && previousScore ? previousScore : undefined,
		})
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Thông tin nhanh</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Giúp chúng tôi cá nhân hoá lộ trình dù bạn bỏ qua đánh giá
				</p>
			</div>

			<div className="space-y-5 rounded-2xl border border-border bg-background p-6">
				<div className="space-y-2.5">
					<p className="text-sm font-medium">Band mục tiêu</p>
					<div className="flex gap-2">
						{TARGET_BANDS.map((b) => (
							<button
								key={b}
								type="button"
								onClick={() => setTargetBand(b)}
								className={toggleBtnClass(targetBand === b)}
							>
								{b}
							</button>
						))}
					</div>
				</div>

				<div className="space-y-2.5">
					<p className="text-sm font-medium">Số năm học tiếng Anh (tuỳ chọn)</p>
					<input
						type="number"
						min={0}
						max={50}
						value={englishYears}
						onChange={(e) => setEnglishYears(e.target.value)}
						placeholder="Ví dụ: 5"
						className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
					/>
				</div>

				<div className="space-y-2.5">
					<p className="text-sm font-medium">Bạn đã thi bài test nào chưa?</p>
					<div className="flex flex-wrap gap-2">
						{PREVIOUS_TESTS.map((t) => (
							<button
								key={t.value}
								type="button"
								onClick={() => setPreviousTest(t.value)}
								className={toggleBtnClass(previousTest === t.value)}
							>
								{t.label}
							</button>
						))}
					</div>
				</div>

				{previousTest !== "none" && (
					<div className="space-y-2.5">
						<p className="text-sm font-medium">Điểm đạt được (tuỳ chọn)</p>
						<input
							type="text"
							value={previousScore}
							onChange={(e) => setPreviousScore(e.target.value)}
							placeholder="Ví dụ: 6.5"
							className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
						/>
					</div>
				)}
			</div>

			<div className="flex gap-3">
				<Button variant="outline" onClick={onBack} className="rounded-xl">
					← Quay lại
				</Button>
				<Button onClick={handleSubmit} disabled={isPending} className="flex-1 rounded-xl">
					{isPending ? "Đang xử lý..." : "Bắt đầu luyện tập"}
				</Button>
			</div>
		</div>
	)
}

// ---------------------------------------------------------------------------
// Quiz inline component
// ---------------------------------------------------------------------------

interface QuizQuestion {
	stem: string
	options: string[]
	correct: number
	level: "A2" | "B1" | "B2" | "C1"
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
	// A2 (3 câu)
	{
		stem: "She _____ to school every day.",
		options: ["go", "goes", "going", "gone"],
		correct: 1,
		level: "A2",
	},
	{
		stem: "What is the opposite of 'hot'?",
		options: ["warm", "cold", "cool", "wet"],
		correct: 1,
		level: "A2",
	},
	{
		stem: "I _____ a student. I study at a university.",
		options: ["is", "are", "am", "be"],
		correct: 2,
		level: "A2",
	},
	// B1 (3 câu)
	{
		stem: "If it rains tomorrow, we _____ at home.",
		options: ["stay", "will stay", "stayed", "would stay"],
		correct: 1,
		level: "B1",
	},
	{
		stem: "He asked me where I _____.",
		options: ["live", "lived", "living", "was live"],
		correct: 1,
		level: "B1",
	},
	{
		stem: "The book _____ by millions of people worldwide.",
		options: ["has read", "has been read", "have read", "is reading"],
		correct: 1,
		level: "B1",
	},
	// B2 (2 câu)
	{
		stem: "Had she studied harder, she _____ the exam.",
		options: ["would pass", "will pass", "would have passed", "has passed"],
		correct: 2,
		level: "B2",
	},
	{
		stem: "The manager insisted that every employee _____ the meeting.",
		options: ["attends", "attend", "attended", "attending"],
		correct: 1,
		level: "B2",
	},
	// C1 (2 câu)
	{
		stem: "Scarcely had he arrived _____ the ceremony began.",
		options: ["than", "when", "that", "then"],
		correct: 1,
		level: "C1",
	},
	{
		stem: "The phenomenon, _____ implications are far-reaching, warrants further investigation.",
		options: ["which", "that", "whose", "whom"],
		correct: 2,
		level: "C1",
	},
]

function scoreQuiz(answers: number[]): string {
	const byLevel: Record<string, { correct: number; total: number }> = {}
	for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
		const q = QUIZ_QUESTIONS[i]
		if (!byLevel[q.level]) byLevel[q.level] = { correct: 0, total: 0 }
		byLevel[q.level].total++
		if (answers[i] === q.correct) byLevel[q.level].correct++
	}

	const levels = ["A2", "B1", "B2", "C1"] as const
	let ceiling = "A2"
	for (const level of levels) {
		const stats = byLevel[level]
		if (!stats || stats.total === 0) continue
		if (stats.correct / stats.total >= 0.6) ceiling = level
		else break
	}
	return ceiling
}

const LETTERS = "ABCD"

function QuizView({
	question,
	index,
	total,
	selected,
	onSelect,
	onBack,
}: {
	question: QuizQuestion
	index: number
	total: number
	selected: number | null
	onSelect: (optionIndex: number) => void
	onBack: () => void
}) {
	const progress = ((index + 1) / total) * 100

	return (
		<div className="space-y-6">
			{/* Progress bar */}
			<div className="space-y-2">
				<div className="flex items-center justify-between text-sm text-muted-foreground">
					<button
						type="button"
						onClick={onBack}
						className="hover:text-foreground transition-colors"
					>
						← Thoát
					</button>
					<span>
						Câu {index + 1}/{total}
					</span>
				</div>
				<div className="h-1.5 rounded-full bg-muted">
					<div
						className="h-full rounded-full bg-primary transition-all duration-500"
						style={{ width: `${progress}%` }}
					/>
				</div>
			</div>

			{/* Question */}
			<div className="rounded-2xl border bg-background p-6">
				<p className="text-lg font-semibold leading-relaxed">{question.stem}</p>
			</div>

			{/* Options */}
			<div className="space-y-3">
				{question.options.map((opt, oi) => (
					<button
						key={`${index}-${oi}`}
						type="button"
						disabled={selected !== null}
						onClick={() => onSelect(oi)}
						className={cn(
							"flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-200",
							selected === oi
								? oi === question.correct
									? "border-emerald-500 bg-emerald-500/10 text-emerald-700"
									: "border-red-500 bg-red-500/10 text-red-700"
								: selected !== null && oi === question.correct
									? "border-emerald-500 bg-emerald-500/5"
									: selected !== null
										? "border-border opacity-50"
										: "border-border hover:border-primary/50 hover:bg-muted/30",
						)}
					>
						<span
							className={cn(
								"flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
								selected === oi
									? oi === question.correct
										? "bg-emerald-500 text-white"
										: "bg-red-500 text-white"
									: "bg-muted text-muted-foreground",
							)}
						>
							{LETTERS[oi]}
						</span>
						<span className="text-sm font-medium">{opt}</span>
					</button>
				))}
			</div>
		</div>
	)
}
