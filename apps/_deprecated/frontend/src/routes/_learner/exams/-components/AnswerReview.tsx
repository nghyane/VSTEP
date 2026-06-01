import { ArrowDown01Icon, ArrowUp01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMemo, useState } from "react"
import { usePresignedUrl } from "@/lib/storage"
import { cn } from "@/lib/utils"
import type {
	ExamSessionDetail,
	ListeningContent,
	ObjectiveAnswer,
	QuestionContent,
	ReadingContent,
	ReadingGapFillContent,
	ReadingMatchingContent,
	ReadingTNGContent,
	SessionAnswer,
	SessionQuestion,
	Skill,
	SubmissionFull,
	WritingContent,
} from "@/types/api"
import { MCQItemReview } from "./questions/MCQItemReview"
import { SKILL_ORDER, skillColor, skillMeta } from "./skill-meta"

/**
 * Normalize answers from API to 1-indexed Record<string, string>.
 * API may return either:
 *   - Array (0-indexed): ["A","B","C"] → {"1":"A","2":"B","3":"C"}
 *   - Object (1-indexed): {"1":"A","2":"B"} → as-is
 *   - Object (0-indexed): {"0":"A","1":"B"} → {"1":"A","2":"B"}
 */
function toIndexedRecord(
	data: Record<string, string> | string[] | undefined,
): Record<string, string> {
	if (!data) return {}
	if (Array.isArray(data)) {
		const out: Record<string, string> = {}
		for (let i = 0; i < data.length; i++) {
			out[String(i + 1)] = data[i]
		}
		return out
	}
	// Object — check if 0-indexed or 1-indexed
	const keys = Object.keys(data)
	if (keys.length > 0 && keys[0] === "0") {
		const out: Record<string, string> = {}
		for (const [k, v] of Object.entries(data)) {
			out[String(Number(k) + 1)] = v
		}
		return out
	}
	return data
}

interface AnswerReviewProps {
	session: ExamSessionDetail
}

function getAnswerMap(answers: SessionAnswer[]): Map<string, SessionAnswer> {
	const map = new Map<string, SessionAnswer>()
	for (const a of answers) {
		map.set(a.questionId, a)
	}
	return map
}

function getSubmissionMap(submissions: SubmissionFull[]): Map<string, SubmissionFull> {
	const map = new Map<string, SubmissionFull>()
	for (const s of submissions) {
		map.set(s.questionId, s)
	}
	return map
}

function groupBySkill(questions: SessionQuestion[]): Map<Skill, SessionQuestion[]> {
	const grouped = new Map<Skill, SessionQuestion[]>()
	for (const q of questions) {
		const list = grouped.get(q.skill) ?? []
		list.push(q)
		grouped.set(q.skill, list)
	}
	return grouped
}

export function AnswerReview({ session }: AnswerReviewProps) {
	const [expandedSkill, setExpandedSkill] = useState<Skill | null>(null)
	const answerMap = useMemo(() => getAnswerMap(session.answers), [session.answers])
	const submissionMap = useMemo(
		() => getSubmissionMap(session.submissions ?? []),
		[session.submissions],
	)
	const skillGroups = useMemo(() => groupBySkill(session.questions), [session.questions])

	const toggle = (skill: Skill) => {
		setExpandedSkill((prev) => (prev === skill ? null : skill))
	}

	const availableSkills = SKILL_ORDER.filter((s) => skillGroups.has(s))

	if (availableSkills.length === 0) return null

	return (
		<div className="space-y-4 rounded-2xl bg-muted/30 p-6 shadow-sm">
			<h2 className="font-semibold">Xem lại đáp án</h2>

			<div className="space-y-3">
				{availableSkills.map((skill) => {
					const questions = skillGroups.get(skill) ?? []
					const isObjective = skill === "listening" || skill === "reading"
					const isExpanded = expandedSkill === skill

					const stats = isObjective ? getObjectiveStats(questions, answerMap) : null

					return (
						<div key={skill} className="overflow-hidden rounded-xl border border-border">
							<button
								type="button"
								onClick={() => toggle(skill)}
								className={cn(
									"flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50",
									skillColor[skill],
								)}
							>
								<HugeiconsIcon icon={skillMeta[skill].icon} className="size-5" />
								<span className="font-medium">{skillMeta[skill].label}</span>

								{stats && (
									<span className="ml-2 text-sm">
										({stats.correct}/{stats.total} đúng)
									</span>
								)}

								<HugeiconsIcon
									icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
									className="ml-auto size-4"
								/>
							</button>

							{isExpanded && (
								<div className="border-t border-border bg-background p-4">
									{isObjective ? (
										<ObjectiveReview questions={questions} answerMap={answerMap} />
									) : (
										<SubjectiveReview
											skill={skill}
											questions={questions}
											answerMap={answerMap}
											submissionMap={submissionMap}
										/>
									)}
								</div>
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
}

function getObjectiveStats(
	questions: SessionQuestion[],
	answerMap: Map<string, SessionAnswer>,
): { correct: number; total: number } {
	let correct = 0
	let total = 0
	for (const q of questions) {
		const normalized = toIndexedRecord(q.answerKey?.correctAnswers)
		const itemCount = Object.keys(normalized).length
		total += itemCount

		const answer = answerMap.get(q.id)
		if (!answer) continue
		const userAnswers = toIndexedRecord(
			"answers" in answer.answer ? answer.answer.answers : undefined,
		)
		for (const [key, expected] of Object.entries(normalized)) {
			if (userAnswers[key] === expected) correct++
		}
	}
	return { correct, total }
}

// --- Objective (Listening / Reading) review ---

function isListeningContent(c: QuestionContent): c is ListeningContent {
	return "audioUrl" in c && "items" in c
}

function isReadingGapFill(c: QuestionContent): c is ReadingGapFillContent {
	return "textWithGaps" in c
}

function isReadingMatching(c: QuestionContent): c is ReadingMatchingContent {
	return "paragraphs" in c && "headings" in c
}

function isReadingPassage(c: QuestionContent): c is ReadingContent | ReadingTNGContent {
	return "passage" in c && "items" in c
}

interface ObjectiveReviewProps {
	questions: SessionQuestion[]
	answerMap: Map<string, SessionAnswer>
}

function ObjectiveReview({ questions, answerMap }: ObjectiveReviewProps) {
	return (
		<div className="space-y-8">
			{questions.map((question) => (
				<ObjectiveQuestionReview key={question.id} question={question} answerMap={answerMap} />
			))}
		</div>
	)
}

function ObjectiveQuestionReview({
	question,
	answerMap,
}: {
	question: SessionQuestion
	answerMap: Map<string, SessionAnswer>
}) {
	const answer = answerMap.get(question.id)
	const userAnswers = toIndexedRecord(
		answer && "answers" in answer.answer ? (answer.answer as ObjectiveAnswer).answers : undefined,
	)
	const correctAnswers = toIndexedRecord(question.answerKey?.correctAnswers)
	const content = question.content

	const items = getItems(content)

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2">
				<h3 className="font-semibold">
					{question.skill === "listening" ? "Listening" : "Reading"} — Part {question.part}
				</h3>
				{answer?.isCorrect !== null && answer?.isCorrect !== undefined && (
					<span
						className={cn(
							"rounded-full px-2.5 py-0.5 text-xs font-medium",
							answer.isCorrect
								? "bg-emerald-500/15 text-emerald-600"
								: "bg-destructive/15 text-destructive",
						)}
					>
						{answer.isCorrect ? "Đúng hết" : "Có sai"}
					</span>
				)}
				{answer?.rawRatio !== null && answer?.rawRatio !== undefined && !answer.isCorrect && (
					<span className="text-xs text-muted-foreground">
						({Math.round(answer.rawRatio * 100)}% đúng)
					</span>
				)}
			</div>

			{/* Show passage/audio context */}
			{isListeningContent(content) && <AudioReviewPlayer audioUrl={content.audioUrl} />}

			{isReadingPassage(content) && (
				<div className="max-h-[300px] overflow-y-auto rounded-xl bg-muted/30 p-5">
					<div className="prose prose-sm whitespace-pre-line">{content.passage}</div>
				</div>
			)}

			{isReadingGapFill(content) && (
				<div className="max-h-[300px] overflow-y-auto rounded-xl bg-muted/30 p-5">
					<div className="prose prose-sm whitespace-pre-line">{content.textWithGaps}</div>
				</div>
			)}

			{isReadingMatching(content) && (
				<div className="max-h-[300px] overflow-y-auto rounded-xl bg-muted/30 p-5">
					<div className="prose prose-sm space-y-4">
						{content.paragraphs.map((para) => (
							<div key={para.label}>
								<span className="font-semibold">{para.label}.</span> {para.text}
							</div>
						))}
					</div>
				</div>
			)}

			{/* MCQ items with correct/wrong indicators */}
			<div className="space-y-6">
				{items.map((item, i) => {
					const key = String(i + 1)
					return (
						<MCQItemReview
							key={`${question.id}-${key}`}
							index={i}
							stem={item.stem}
							options={item.options}
							selectedOption={userAnswers[key] ?? null}
							correctOption={correctAnswers[key] ?? null}
						/>
					)
				})}
			</div>

			{/* Explanation */}
			{question.explanation && (
				<div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
					<p className="text-sm font-medium text-primary">Giải thích</p>
					<p className="mt-1 whitespace-pre-line text-sm">{question.explanation}</p>
				</div>
			)}
		</div>
	)
}

function getItems(content: QuestionContent): { stem: string; options: string[] }[] {
	if (isListeningContent(content)) return content.items
	if (isReadingPassage(content)) return content.items
	if (isReadingGapFill(content))
		return content.items.map((item, i) => ({
			stem: `Gap ${i + 1}`,
			options: item.options,
		}))
	if (isReadingMatching(content))
		return content.paragraphs.map((para) => ({
			stem: `${para.label}. ${para.text}`,
			options: content.headings,
		}))
	return []
}

function AudioReviewPlayer({ audioUrl }: { audioUrl: string }) {
	const { data: audioSrc } = usePresignedUrl(audioUrl)

	return (
		<div className="rounded-xl bg-muted/30 p-4">
			{/* biome-ignore lint/a11y/useMediaCaption: VSTEP listening exam audio review */}
			<audio
				controls
				controlsList="nodownload"
				preload="metadata"
				className="w-full"
				src={audioSrc ?? ""}
			/>
		</div>
	)
}

// --- Subjective (Writing / Speaking) review ---

interface SubjectiveReviewProps {
	skill: Skill
	questions: SessionQuestion[]
	answerMap: Map<string, SessionAnswer>
	submissionMap: Map<string, SubmissionFull>
}

function SubjectiveReview({ skill, questions, answerMap, submissionMap }: SubjectiveReviewProps) {
	return (
		<div className="space-y-8">
			{questions.map((question) => {
				const submission = submissionMap.get(question.id)
				const answer = answerMap.get(question.id)

				return (
					<SubjectiveQuestionReview
						key={question.id}
						skill={skill}
						question={question}
						answer={answer}
						submission={submission}
					/>
				)
			})}
		</div>
	)
}

function SubjectiveQuestionReview({
	skill,
	question,
	answer,
	submission,
}: {
	skill: Skill
	question: SessionQuestion
	answer: SessionAnswer | undefined
	submission: SubmissionFull | undefined
}) {
	const content = question.content
	const isWriting = skill === "writing" && "prompt" in content

	return (
		<div className="space-y-4">
			<h3 className="font-semibold">
				{skill === "writing" ? "Writing" : "Speaking"} — Part {question.part}
			</h3>

			{/* Writing prompt */}
			{isWriting && (
				<div className="rounded-xl bg-muted/30 p-4">
					<p className="whitespace-pre-line text-sm">{(content as WritingContent).prompt}</p>
				</div>
			)}

			{/* User's writing answer */}
			{answer && "text" in answer.answer && (
				<div className="rounded-xl border border-border p-4">
					<p className="mb-2 text-xs font-medium text-muted-foreground">Bài viết của bạn</p>
					<p className="whitespace-pre-line text-sm">{answer.answer.text}</p>
				</div>
			)}

			{/* User's speaking answer */}
			{answer && "audioPath" in answer.answer && (
				<div className="rounded-xl border border-border p-4">
					<p className="mb-2 text-xs font-medium text-muted-foreground">Bài nói của bạn</p>
					<SpeakingAudioPlayer audioPath={answer.answer.audioPath} />
					{answer.answer.transcript && (
						<p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
							{answer.answer.transcript}
						</p>
					)}
				</div>
			)}

			{/* Grading result */}
			{submission ? (
				<SubmissionResult submission={submission} />
			) : (
				<div className="rounded-xl bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
					Đang chấm bài...
				</div>
			)}
		</div>
	)
}

function SpeakingAudioPlayer({ audioPath }: { audioPath: string }) {
	const { data: audioSrc } = usePresignedUrl(audioPath)

	return (
		/* biome-ignore lint/a11y/useMediaCaption: VSTEP speaking review audio */
		<audio
			controls
			controlsList="nodownload"
			preload="metadata"
			className="w-full"
			src={audioSrc ?? ""}
		/>
	)
}

function SubmissionResult({ submission }: { submission: SubmissionFull }) {
	if (submission.status === "pending" || submission.status === "processing") {
		return (
			<div className="rounded-xl bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
				Đang chấm bài...
			</div>
		)
	}

	if (submission.status === "failed") {
		return (
			<div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
				Chấm bài thất bại. Vui lòng liên hệ hỗ trợ.
			</div>
		)
	}

	return (
		<div className="space-y-3">
			{/* Score */}
			{submission.score !== null && (
				<div className="flex items-center gap-3">
					<span className="text-sm font-medium">Điểm:</span>
					<span className="text-lg font-bold text-primary">{submission.score}/10</span>
					{submission.band && (
						<span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
							{submission.band}
						</span>
					)}
				</div>
			)}

			{/* Criteria scores */}
			{submission.result &&
				"criteriaScores" in submission.result &&
				submission.result.criteriaScores && (
					<CriteriaScores criteria={submission.result.criteriaScores} />
				)}

			{/* Feedback */}
			{submission.feedback && (
				<div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
					<p className="text-sm font-medium text-primary">Nhận xét</p>
					<p className="mt-1 whitespace-pre-line text-sm">{submission.feedback}</p>
				</div>
			)}

			{/* Grammar errors */}
			{submission.result &&
				"grammarErrors" in submission.result &&
				submission.result.grammarErrors &&
				submission.result.grammarErrors.length > 0 && (
					<div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
						<p className="text-sm font-medium text-amber-700 dark:text-amber-400">Lỗi ngữ pháp</p>
						<ul className="mt-2 space-y-1 text-sm">
							{submission.result.grammarErrors.map((err, i) => (
								<li key={`err-${i}`} className="flex items-start gap-2">
									<HugeiconsIcon
										icon={Cancel01Icon}
										className="mt-0.5 size-3.5 shrink-0 text-amber-600"
									/>
									<span>
										{err.message}
										{err.suggestion && (
											<span className="ml-1 text-emerald-600 dark:text-emerald-400">
												→ {err.suggestion}
											</span>
										)}
									</span>
								</li>
							))}
						</ul>
					</div>
				)}
		</div>
	)
}

const CRITERIA_LABELS: Record<string, string> = {
	task_achievement: "Hoàn thành yêu cầu",
	coherence_cohesion: "Tính liên kết",
	lexical_resource: "Từ vựng",
	grammatical_range: "Ngữ pháp",
	pronunciation: "Phát âm",
	fluency: "Trôi chảy",
	task_fulfillment: "Đáp ứng đề bài",
}

function CriteriaScores({ criteria }: { criteria: Record<string, number> }) {
	const entries = Object.entries(criteria)
	if (entries.length === 0) return null

	return (
		<div className="space-y-2">
			<p className="text-sm font-medium">Chi tiết tiêu chí</p>
			<div className="grid gap-2 sm:grid-cols-2">
				{entries.map(([key, score]) => (
					<div
						key={key}
						className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
					>
						<span className="text-sm">{CRITERIA_LABELS[key] ?? key}</span>
						<span className="font-semibold text-sm">{score}/10</span>
					</div>
				))}
			</div>
		</div>
	)
}
