import { AlertCircleIcon, BulbIcon, Cancel01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { SpiderChart } from "@/components/common/SpiderChart"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Exam, ExamSessionDetail, MCQItem, SessionAnswer, SessionQuestion, Skill } from "@/types/api"
import { SKILL_ORDER, skillColor, skillMeta } from "./skill-meta"

function normalizeOptions(options: unknown): string[] {
	if (Array.isArray(options)) return options
	if (typeof options === "object" && options !== null) {
		return Object.keys(options)
			.sort()
			.map((k) => (options as Record<string, string>)[k])
	}
	return []
}

interface SessionCompletedProps {
	session: ExamSessionDetail
	exam: Exam | null
}

const bandLabel: Record<string, string> = {
	B1: "B1 – Trung cấp",
	B2: "B2 – Trung cao cấp",
	C1: "C1 – Cao cấp",
}

export function SessionCompleted({ session, exam }: SessionCompletedProps) {
	const scores: { skill: Skill; score: number | null; label: string }[] = [
		{ skill: "listening", score: session.listeningScore, label: skillMeta.listening.label },
		{ skill: "reading", score: session.readingScore, label: skillMeta.reading.label },
		{ skill: "writing", score: session.writingScore, label: skillMeta.writing.label },
		{ skill: "speaking", score: session.speakingScore, label: skillMeta.speaking.label },
	]

	const graded = scores.filter((s) => s.score !== null)
	const strong = graded.filter((s) => s.score! >= 7)
	const weak = graded.filter((s) => s.score! < 7)
	const weakest = [...graded].sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0] as
		| (typeof scores)[number]
		| undefined

	const spiderSkills = scores.map((s) => ({
		label: s.label,
		value: s.score ?? 0,
		color: `text-skill-${s.skill}`,
	}))

	const isSubmitted = session.status === "submitted"

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="rounded-2xl bg-muted/30 p-6 shadow-sm">
				<h1 className="text-xl font-bold">Kết quả thi {exam ? `— Đề ${exam.level}` : ""}</h1>
				{session.completedAt && (
					<p className="mt-1 text-sm text-muted-foreground">
						{new Date(session.completedAt).toLocaleString("vi-VN")}
					</p>
				)}
			</div>

			{/* Grading in progress banner */}
			{isSubmitted && (
				<div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
					<span className="relative flex size-3">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
						<span className="relative inline-flex size-3 rounded-full bg-amber-500" />
					</span>
					<div>
						<p className="font-semibold text-amber-700 dark:text-amber-400">Đang chấm bài...</p>
						<p className="text-sm text-amber-600/80 dark:text-amber-400/70">
							AI đang chấm Writing và Speaking. Thường mất 1-2 phút.
						</p>
					</div>
				</div>
			)}

			{/* Overall score + band */}
			{session.overallScore !== null && (
				<div className="rounded-2xl bg-primary/10 p-6 text-center">
					<p className="text-sm font-medium text-muted-foreground">Điểm tổng</p>
					<p className="mt-1 text-4xl font-bold text-primary">
						{session.overallScore}
						<span className="text-lg font-normal text-muted-foreground"> / 10</span>
					</p>
					{session.overallBand && (
						<p className="mt-2 text-sm font-semibold text-primary">
							Band: {bandLabel[session.overallBand] ?? session.overallBand}
						</p>
					)}
				</div>
			)}

			{/* Spider chart + Skill scores */}
			<div className="grid items-center gap-6 lg:grid-cols-2">
				<SpiderChart skills={spiderSkills} className="mx-auto aspect-square w-full max-w-[320px]" />

				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
					{scores.map(({ skill, score }) => {
						const meta = skillMeta[skill]
						return (
							<div
								key={skill}
								className={cn("flex items-center gap-3 rounded-xl p-4", skillColor[skill])}
							>
								<HugeiconsIcon icon={meta.icon} className="size-5" />
								<span className="font-medium">{meta.label}</span>
								<span className="ml-auto font-semibold">
									{score !== null ? `${score}/10` : "Đang chấm"}
								</span>
							</div>
						)
					})}
				</div>
			</div>

			{/* Strengths & weaknesses */}
			{graded.length > 0 && (
				<div className="space-y-4 rounded-2xl bg-muted/30 p-6 shadow-sm">
					<h2 className="font-semibold">Phân tích điểm mạnh / yếu</h2>

					{strong.length > 0 && (
						<div className="space-y-1">
							<p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
								<HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
								Mạnh
							</p>
							<ul className="space-y-1 pl-6 text-sm">
								{strong.map((s) => (
									<li key={s.skill}>
										{s.label} — <span className="font-semibold">{s.score}/10</span>
									</li>
								))}
							</ul>
						</div>
					)}

					{weak.length > 0 && (
						<div className="space-y-1">
							<p className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
								<HugeiconsIcon icon={AlertCircleIcon} className="size-4" />
								Cần cải thiện
							</p>
							<ul className="space-y-1 pl-6 text-sm">
								{weak.map((s) => (
									<li key={s.skill}>
										{s.label} — <span className="font-semibold">{s.score}/10</span>
									</li>
								))}
							</ul>
						</div>
					)}

					{weakest && (
						<p className="text-sm text-muted-foreground">
							<span className="inline-flex items-center gap-1.5">
								<HugeiconsIcon icon={BulbIcon} className="size-4" />
								Gợi ý: Luyện thêm {weakest.label} để nâng band tổng.
							</span>
						</p>
					)}
				</div>
			)}

			{/* Answer Review — objective skills */}
			<AnswerReview session={session} />

			{/* CTA buttons */}
			<div className="flex flex-wrap gap-3">
				{weakest && (
					<Link to="/practice" search={{ skill: weakest.skill }}>
						<Button>Luyện {weakest.label} ngay</Button>
					</Link>
				)}
				<Link to="/practice">
					<Button variant="outline">Về trang Luyện tập</Button>
				</Link>
			</div>
		</div>
	)
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

function AnswerReview({ session }: { session: ExamSessionDetail }) {
	const [openSkill, setOpenSkill] = useState<Skill | null>(null)

	const answerMap = useMemo(() => {
		const map = new Map<string, SessionAnswer>()
		for (const a of session.answers) map.set(a.questionId, a)
		return map
	}, [session.answers])

	const questionsBySkill = useMemo(() => {
		const map = new Map<Skill, SessionQuestion[]>()
		for (const q of session.questions) {
			if (q.skill !== "listening" && q.skill !== "reading") continue
			const list = map.get(q.skill) ?? []
			list.push(q)
			map.set(q.skill, list)
		}
		return map
	}, [session.questions])

	const objectiveSkills = SKILL_ORDER.filter((s) => (questionsBySkill.get(s)?.length ?? 0) > 0)

	if (objectiveSkills.length === 0) return null

	return (
		<div className="space-y-3">
			<h2 className="font-semibold">Xem lại đáp án</h2>
			{objectiveSkills.map((skill) => {
				const questions = questionsBySkill.get(skill) ?? []
				const correct = questions.filter((q) => answerMap.get(q.id)?.isCorrect === true).length
				const isOpen = openSkill === skill

				return (
					<div key={skill} className="rounded-2xl bg-muted/30 shadow-sm">
						<button
							type="button"
							className="flex w-full items-center gap-3 p-5"
							onClick={() => setOpenSkill(isOpen ? null : skill)}
						>
							<HugeiconsIcon icon={skillMeta[skill].icon} className="size-5" />
							<span className="font-medium">{skillMeta[skill].label}</span>
							<span className="ml-auto text-sm text-muted-foreground">
								{correct}/{questions.length} câu đúng
							</span>
							<span className={cn("text-xs transition-transform", isOpen && "rotate-180")}>▼</span>
						</button>

						{isOpen && (
							<div className="space-y-4 border-t px-5 pb-5 pt-4">
								{questions.map((q, qi) => (
									<ReviewQuestion
										key={q.id}
										question={q}
										index={qi}
										answer={answerMap.get(q.id) ?? null}
									/>
								))}
							</div>
						)}
					</div>
				)
			})}
		</div>
	)
}

function ReviewQuestion({
	question,
	index,
	answer,
}: {
	question: SessionQuestion
	index: number
	answer: SessionAnswer | null
}) {
	const raw = question.content as unknown as Record<string, unknown>
	const hasItems = "items" in raw && Array.isArray(raw.items)
	const items: MCQItem[] = hasItems
		? (raw.items as MCQItem[])
		: "stem" in raw && "options" in raw
			? [{ stem: raw.stem as string, options: normalizeOptions(raw.options) }]
			: []
	const userAnswers: Record<string, string> =
		answer?.answer && "answers" in answer.answer ? answer.answer.answers : {}
	// Normalize answerKey: BE returns {correctAnswers: ["A"]} for individual questions
	// FE grouped format uses {"1": "A", "2": "B"}
	const rawKey = question.answerKey as Record<string, unknown> | null | undefined
	let correctAnswers: Record<string, string> = {}
	if (rawKey) {
		if (Array.isArray(rawKey.correctAnswers)) {
			correctAnswers = Object.fromEntries(
				(rawKey.correctAnswers as string[]).map((v, i) => [String(i + 1), v]),
			)
		} else {
			correctAnswers = rawKey as unknown as Record<string, string>
		}
	}
	const isCorrect = answer?.isCorrect

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				{isCorrect === true && (
					<HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4 text-emerald-500" />
				)}
				{isCorrect === false && (
					<HugeiconsIcon icon={Cancel01Icon} className="size-4 text-destructive" />
				)}
				<span className="text-sm font-medium">Câu {index + 1} — Part {question.part}</span>
			</div>

			{items.map((item, i) => {
				const key = String(i + 1)
				const userPick = userAnswers[key]
				const correctPick = correctAnswers[key]

				return (
					<div key={key} className="rounded-lg bg-muted/30 p-3">
						<p className="mb-2 text-sm">{item.stem}</p>
						<div className="space-y-1">
							{item.options.map((opt, oi) => {
								const letter = LETTERS[oi]
								const isUser = userPick === letter
								const isAnswer = correctPick === letter
								const wrong = isUser && !isAnswer

								return (
									<div
										key={letter}
										className={cn(
											"flex items-center gap-2 rounded-md px-3 py-1.5 text-sm",
											isAnswer && "bg-emerald-500/10 font-medium text-emerald-700 dark:text-emerald-400",
											wrong && "bg-destructive/10 text-destructive line-through",
										)}
									>
										<span className="w-5 shrink-0 font-semibold">{letter}</span>
										<span>{opt}</span>
										{isAnswer && <span className="ml-auto text-xs">✓</span>}
										{wrong && <span className="ml-auto text-xs">✗</span>}
									</div>
								)
							})}
						</div>
					</div>
				)
			})}
		</div>
	)
}
